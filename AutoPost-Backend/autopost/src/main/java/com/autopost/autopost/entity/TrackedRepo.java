package com.autopost.autopost.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tracked_repos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackedRepo {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    /** Owner of this repo tracking — every query scopes to this user. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_auth_id", nullable = false)
    private UserAuth userAuth;

    @Column(nullable = false)
    private String repoUrl;

    /** AI-generated description of the project. Nullable until Call A runs. */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String projectDescription;

    /** SHA of the last commit we fetched — used to avoid re-fetching old commits. */
    private String lastSyncedCommitSha;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant addedAt = Instant.now();

    /** All drafts for this repo — cascade delete when repo is removed. */
    @OneToMany(mappedBy = "repo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WeeklyDraft> drafts = new ArrayList<>();

    /** All notes attached to this repo — cascade delete when repo is removed. */
    @OneToMany(mappedBy = "repo", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WeeklyNote> notes = new ArrayList<>();
}
