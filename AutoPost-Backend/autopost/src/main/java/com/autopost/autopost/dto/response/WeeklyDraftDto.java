package com.autopost.autopost.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Matches the frontend WeeklyDraft type.
 * repoName is derived at serialization time from the last path segment of repoUrl.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDraftDto {
    private Long id;
    private Long repoId;
    private String repoName;   // derived — last path segment of repoUrl
    private LocalDate weekOf;
    private String content;
    private String status;
    private Instant generatedAt;
    private Integer commitCount;
    private Integer noteCount;
}
