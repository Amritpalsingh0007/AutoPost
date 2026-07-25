package com.autopost.autopost.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "weekly_notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyNote {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    /** The user who wrote this note — used for ownership checks. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_auth_id", nullable = false)
    private UserAuth userAuth;

    /**
     * Optional link to a specific repo.
     * null → general note not tied to any repo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id")
    private TrackedRepo repo;

    /** The Monday of the week this note belongs to. */
    @Column(name = "week_of", nullable = false)
    private LocalDate weekOf;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;
}
