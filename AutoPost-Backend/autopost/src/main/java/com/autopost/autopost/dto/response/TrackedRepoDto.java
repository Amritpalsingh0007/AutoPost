package com.autopost.autopost.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Matches the frontend TrackedRepo type exactly.
 * weeklyGrid is computed at request time — never stored.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackedRepoDto {
    private Long id;
    private String repoUrl;
    private String projectDescription;
    private String lastSyncedCommitSha;
    private Instant addedAt;
    private List<WeekStatusDto> weeklyGrid;
}
