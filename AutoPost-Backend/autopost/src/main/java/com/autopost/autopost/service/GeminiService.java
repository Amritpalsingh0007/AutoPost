package com.autopost.autopost.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Wraps the Gemini generativelanguage REST API with a model rotation pool.
 *
 * Logic is intentionally simple:
 *   - Try each model in order.
 *   - If the API returns 429 / 503, record the exact timestamp and skip this model
 *     for the rest of the calendar day.
 *   - At midnight the block clears automatically on the next request.
 *
 * No request counting — each model's own rate limit is enforced by the API.
 * We only act on what the API actually tells us.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Models tried in priority order.
     * Add / reorder here — no other code needs to change.
     */
    private static final List<String> MODEL_POOL = List.of(
            "gemini-2.5-pro",
            "gemini-3.5-flash",
            "gemini-3-flash",
            "gemini-2.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite"
    );

    @Value("${GOOGLE_API_KEY:}")
    private String apiKey;

    private final WebClient webClient;

    /**
     * Per-model rate-limit timestamp. Index matches MODEL_POOL.
     * null  → model has never been rate-limited (or block was cleared at midnight).
     * non-null → the exact moment the API returned 429/503 for this model today.
     */
    private final AtomicReference<LocalDateTime>[] rateLimitedAt;

    /** The date the current blocks belong to — used to detect day rollover. */
    private volatile LocalDate blockDate = LocalDate.now();

    @SuppressWarnings("unchecked")
    public GeminiService() {
        this.webClient = WebClient.builder()
                .baseUrl(GEMINI_BASE_URL)
                .defaultHeader("Content-Type", "application/json")
                .build();

        this.rateLimitedAt = new AtomicReference[MODEL_POOL.size()];
        for (int i = 0; i < rateLimitedAt.length; i++) {
            rateLimitedAt[i] = new AtomicReference<>(null);
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Call A — generates a short project description from the repo URL and recent commits.
     */
    public String generateProjectDescription(String repoUrl, List<String> commitSamples) {
        if (isApiKeyMissing()) {
            return "AI-generated project description for " + GitHubService.extractRepoName(repoUrl)
                    + ". Configure GOOGLE_API_KEY to enable real generation.";
        }
        return callGeminiWithFallback(buildDescriptionPrompt(repoUrl, commitSamples));
    }

    /**
     * Call B — synthesises a LinkedIn-ready weekly update post from commits and notes.
     */
    public String generateWeeklyDraft(String repoUrl,
                                      String projectDesc,
                                      List<String> commitMessages,
                                      List<String> notes) {
        if (isApiKeyMissing()) {
            return "This week I made progress on " + GitHubService.extractRepoName(repoUrl)
                    + ". Configure GOOGLE_API_KEY to enable real AI-generated posts.";
        }
        return callGeminiWithFallback(buildDraftPrompt(repoUrl, projectDesc, commitMessages, notes));
    }

    // -------------------------------------------------------------------------
    // Model rotation
    // -------------------------------------------------------------------------

    private String callGeminiWithFallback(String prompt) {
        clearBlocksIfNewDay();
        LocalDate today = LocalDate.now();

        for (int i = 0; i < MODEL_POOL.size(); i++) {
            String model = MODEL_POOL.get(i);

            // Skip if this model was rate-limited at any point today
            LocalDateTime blockedAt = rateLimitedAt[i].get();
            if (blockedAt != null && blockedAt.toLocalDate().equals(today)) {
                log.info("Skipping model {} — rate-limited today at {}.",
                        model, blockedAt.format(TS_FORMAT));
                continue;
            }

            // Attempt the call
            try {
                String result = callGemini(prompt, model);
                log.debug("Gemini call succeeded with model {}.", model);
                return result;

            } catch (WebClientResponseException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS
                        || e.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE) {

                    LocalDateTime now = LocalDateTime.now();
                    rateLimitedAt[i].set(now);
                    log.warn("Model {} rate-limited at {} (HTTP {}) — blocked for the rest of today.",
                            model, now.format(TS_FORMAT), e.getStatusCode().value());

                } else {
                    // 400 / 401 etc. won't be fixed by switching models — fail fast
                    log.error("Model {} returned HTTP {}: {}",
                            model, e.getStatusCode().value(), e.getResponseBodyAsString());
                    return "Content generation failed: HTTP " + e.getStatusCode().value()
                            + " — " + e.getMessage();
                }

            } catch (Exception e) {
                log.error("Model {} threw unexpected exception: {}", model, e.getMessage());
                return "Content generation failed: " + e.getMessage();
            }
        }

        // Every model is blocked for today
        log.error("All {} Gemini models are rate-limited for today.", MODEL_POOL.size());
        logBlockSummary(today);
        return "All AI models have reached their daily request limits. Please try again tomorrow.";
    }

    // -------------------------------------------------------------------------
    // Single HTTP call
    // -------------------------------------------------------------------------

    private String callGemini(String prompt, String model) {
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        GeminiResponse response = webClient.post()
                .uri("/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(GeminiResponse.class)
                .block();

        if (response == null
                || response.candidates() == null
                || response.candidates().isEmpty()) {
            return "Unable to generate content — empty response from Gemini.";
        }

        return response.candidates().get(0).content().parts().get(0).text();
    }

    // -------------------------------------------------------------------------
    // State management
    // -------------------------------------------------------------------------

    /**
     * Clears all rate-limit blocks when the calendar date rolls over.
     * Double-checked locking ensures exactly one thread does the reset.
     */
    private void clearBlocksIfNewDay() {
        LocalDate today = LocalDate.now();
        if (!today.equals(blockDate)) {
            synchronized (this) {
                if (!today.equals(blockDate)) {
                    log.info("New day ({}). Clearing all Gemini rate-limit blocks.", today);
                    for (AtomicReference<LocalDateTime> ref : rateLimitedAt) {
                        ref.set(null);
                    }
                    blockDate = today;
                }
            }
        }
    }

    private boolean isApiKeyMissing() {
        return apiKey == null || apiKey.isBlank();
    }

    /** Printed when all models are exhausted — shows exactly when each was blocked. */
    private void logBlockSummary(LocalDate today) {
        StringBuilder sb = new StringBuilder("Gemini block summary for ").append(today).append(":\n");
        for (int i = 0; i < MODEL_POOL.size(); i++) {
            LocalDateTime blocked = rateLimitedAt[i].get();
            sb.append("  ").append(MODEL_POOL.get(i))
              .append(" — rate-limited at: ")
              .append(blocked != null ? blocked.format(TS_FORMAT) : "not blocked (soft-cap or other)")
              .append("\n");
        }
        log.error(sb.toString());
    }

    // -------------------------------------------------------------------------
    // Prompt builders
    // -------------------------------------------------------------------------

    private String buildDescriptionPrompt(String repoUrl, List<String> commitSamples) {
        String commits = commitSamples.isEmpty()
                ? "(no commits available)"
                : String.join("\n- ", commitSamples);

        return """
                You are a technical writer. Given the GitHub repository URL and some recent commit messages,
                write a concise 2-3 sentence description of what this project does.
                Be specific, avoid generic phrases like "this project is a...".

                Repository: %s
                Recent commits:
                - %s

                Write only the description, no preamble.
                """.formatted(repoUrl, commits);
    }

    private String buildDraftPrompt(String repoUrl,
                                    String projectDesc,
                                    List<String> commitMessages,
                                    List<String> notes) {
        String commits = commitMessages.isEmpty()
                ? "(no commits this week)"
                : String.join("\n- ", commitMessages);

        String notesText = notes.isEmpty()
                ? "(no notes this week)"
                : String.join("\n- ", notes);

        return """
                You are writing a LinkedIn post for a software developer.
                Write an engaging, professional weekly update post (150-250 words) based on the work below.
                Use first person. Focus on what was built or learned. Add 3-5 relevant hashtags at the end.
                Do NOT use phrases like "This week I" as the opening — be more creative.

                Project: %s
                Description: %s

                Commits this week:
                - %s

                Developer notes:
                - %s

                Write only the post content, no preamble.
                """.formatted(GitHubService.extractRepoName(repoUrl), projectDesc, commits, notesText);
    }

    // -------------------------------------------------------------------------
    // Response shape
    // -------------------------------------------------------------------------

    private record GeminiResponse(List<Candidate> candidates) {}
    private record Candidate(Content content) {}
    private record Content(List<Part> parts) {}
    private record Part(String text) {}
}
