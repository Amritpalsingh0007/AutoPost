package com.autopost.autopost.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
    name = "weekly_drafts",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_draft_repo_week",
        columnNames = {"repo_id", "week_of"}
    )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "repo_id", nullable = false)
    private TrackedRepo repo;

    /**
     * The Monday of the week this draft covers.
     * Unique per (repo, weekOf) — enforced by the table constraint above.
     */
    @Column(name = "week_of", nullable = false)
    private LocalDate weekOf;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DraftStatus status = DraftStatus.DRAFT;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant generatedAt = Instant.now();

    /** Number of commits the AI synthesised this draft from. */
    private Integer commitCount;

    /** Number of weekly notes included in the synthesis. */
    private Integer noteCount;
}
