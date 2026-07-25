package com.autopost.autopost.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Handles all interactions with the GitHub REST API.
 *
 * Validation uses the public /repos/{owner}/{repo} endpoint — no auth required
 * for public repos. An optional personal access token can be configured to raise
 * the rate limit from 60 to 5000 requests/hour.
 */
@Service
public class GitHubService {

    private static final Pattern GITHUB_URL_PATTERN =
            Pattern.compile("https://github\\.com/([\\w.-]+)/([\\w.-]+)");

    private final WebClient webClient;

    public GitHubService(@Value("${github.token:}") String githubToken) {
        WebClient.Builder builder = WebClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28");

        if (githubToken != null && !githubToken.isBlank()) {
            builder.defaultHeader("Authorization", "Bearer " + githubToken);
        }

        this.webClient = builder.build();
    }

    /**
     * Validates that the URL points to a real, accessible public GitHub repo.
     * Throws IllegalArgumentException if the repo doesn't exist or isn't reachable.
     */
    public void validatePublicRepo(String repoUrl) {
        OwnerRepo ownerRepo = parseUrl(repoUrl);
        try {
            webClient.get()
                    .uri("/repos/{owner}/{repo}", ownerRepo.owner(), ownerRepo.repo())
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException.NotFound e) {
            throw new IllegalArgumentException("GitHub repository not found or is private: " + repoUrl);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not reach GitHub API to validate repo: " + e.getMessage());
        }
    }

    /**
     * Fetches commit messages for a repo within a given week.
     * Returns a list of commit message strings to feed into the AI.
     *
     * @param repoUrl  the full GitHub URL
     * @param weekStart  Monday of the week (inclusive)
     * @param weekEnd    Sunday of the week (inclusive)
     */
    public List<String> fetchCommitMessages(String repoUrl, LocalDate weekStart, LocalDate weekEnd) {
        OwnerRepo ownerRepo = parseUrl(repoUrl);

        // GitHub API uses ISO-8601 timestamps with time component
        String since = weekStart.atStartOfDay() + "Z";
        String until = weekEnd.plusDays(1).atStartOfDay() + "Z";  // exclusive upper bound

        try {
            List<GitHubCommitResponse> commits = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/repos/{owner}/{repo}/commits")
                            .queryParam("since", since)
                            .queryParam("until", until)
                            .queryParam("per_page", 100)
                            .build(ownerRepo.owner(), ownerRepo.repo()))
                    .retrieve()
                    .bodyToFlux(GitHubCommitResponse.class)
                    .collectList()
                    .block();

            if (commits == null) return List.of();
            return commits.stream()
                    .map(c -> c.commit() != null ? c.commit().message() : "")
                    .filter(m -> !m.isBlank())
                    .toList();

        } catch (Exception e) {
            // Non-fatal — return empty list and let caller decide how to handle
            return List.of();
        }
    }

    /**
     * Extracts the last path segment of the URL as the repo display name.
     * e.g. "https://github.com/alice/my-project" → "my-project"
     */
    public static String extractRepoName(String repoUrl) {
        if (repoUrl == null || repoUrl.isBlank()) return "";
        String trimmed = repoUrl.endsWith("/") ? repoUrl.substring(0, repoUrl.length() - 1) : repoUrl;
        int lastSlash = trimmed.lastIndexOf('/');
        return lastSlash >= 0 ? trimmed.substring(lastSlash + 1) : trimmed;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private OwnerRepo parseUrl(String repoUrl) {
        Matcher m = GITHUB_URL_PATTERN.matcher(repoUrl);
        if (!m.matches()) {
            throw new IllegalArgumentException("Invalid GitHub URL: " + repoUrl);
        }
        return new OwnerRepo(m.group(1), m.group(2));
    }

    private record OwnerRepo(String owner, String repo) {}

    // Minimal response shapes for the GitHub API — only the fields we need
    private record GitHubCommitResponse(CommitDetail commit) {}
    private record CommitDetail(String message) {}
}
