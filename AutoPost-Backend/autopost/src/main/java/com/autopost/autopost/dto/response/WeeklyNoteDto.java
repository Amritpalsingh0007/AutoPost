package com.autopost.autopost.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Matches the frontend WeeklyNote type.
 * repoId / repoName are null for general notes not tied to any repo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyNoteDto {
    private Long id;
    private Long repoId;       // null for general notes
    private String repoName;   // null for general notes
    private LocalDate weekOf;
    private String text;
}
