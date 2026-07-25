package com.autopost.autopost.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * Wraps the Gemini generativelanguage REST API.
 *
 * API key is read from the environment — leave it blank for now and the stub
 * fallback text is returned instead.  Wire in the real key when ready to test.
 *
 * Endpoint used: POST /v1beta/models/gemini-2.0-flash:generateContent
 */
@Service
public class GeminiService {

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";
    private static final String MODEL = "gemini-2.0-flash";

    @Value("${gemini.apiKey:}")
    private String apiKey;

    private final WebClient webClient;

    public GeminiService() {
        this.webClient = WebClient.builder()
                .baseUrl(GEMINI_BASE_URL)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    /**
     * Call A — generates a short project description from the repo URL and README content.
     *
     * @param repoUrl           full GitHub URL
     * @param commitSamples     a few recent commit messages to give the model context
     * @return                  AI-generated description, or a placeholder if API key not set
     */
    public String generateProjectDescription(String repoUrl, List<String> commitSamples) {
        if (apiKey == null || apiKey.isBlank()) {
            // Stub — replace once API key is configured
            return "AI-generated project description for " + GitHubService.extractRepoName(repoUrl)
                    + ". Configure gemini.apiKey to enable real generation.";
        }

        String prompt = buildDescriptionPrompt(repoUrl, commitSamples);
        return callGemini(prompt);
    }

    /**
     * Call B — synthesises a LinkedIn-ready weekly update post from commits and notes.
     *
     * @param repoUrl        full GitHub URL
     * @param projectDesc    the stored project description for context
     * @param commitMessages commit messages from the target week
     * @param notes          user-written notes from the target week
     * @return               AI-generated post content, or a placeholder if API key not set
     */
    public String generateWeeklyDraft(String repoUrl,
                                      String projectDesc,
                                      List<String> commitMessages,
                                      List<String> notes) {
        if (apiKey == null || apiKey.isBlank()) {
            // Stub — replace once API key is configured
            return "This week I made progress on " + GitHubService.extractRepoName(repoUrl)
                    + ". Configure gemini.apiKey to enable real AI-generated posts.";
        }

        String prompt = buildDraftPrompt(repoUrl, projectDesc, commitMessages, notes);
        return callGemini(prompt);
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
    // HTTP call
    // -------------------------------------------------------------------------

    private String callGemini(String prompt) {
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        try {
            GeminiResponse response = webClient.post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", MODEL, apiKey)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class)
                    .block();

            if (response == null
                    || response.candidates() == null
                    || response.candidates().isEmpty()) {
                return "Unable to generate content — empty response from Gemini.";
            }

            return response.candidates().get(0)
                    .content().parts().get(0).text();

        } catch (Exception e) {
            return "Content generation failed: " + e.getMessage();
        }
    }

    // -------------------------------------------------------------------------
    // Minimal response shape for Gemini API
    // -------------------------------------------------------------------------

    private record GeminiResponse(List<Candidate> candidates) {}
    private record Candidate(Content content) {}
    private record Content(List<Part> parts) {}
    private record Part(String text) {}
}
