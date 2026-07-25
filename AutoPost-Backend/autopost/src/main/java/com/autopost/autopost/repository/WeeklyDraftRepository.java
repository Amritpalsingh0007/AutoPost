package com.autopost.autopost.repository;

import com.autopost.autopost.entity.TrackedRepo;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.entity.WeeklyDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyDraftRepository extends JpaRepository<WeeklyDraft, Long> {

    /** All drafts for a specific repo, newest first. */
    List<WeeklyDraft> findAllByRepoOrderByWeekOfDesc(TrackedRepo repo);

    /** All drafts across all repos owned by a user — used on Dashboard / History. */
    @Query("SELECT d FROM WeeklyDraft d WHERE d.repo.userAuth = :userAuth ORDER BY d.weekOf DESC")
    List<WeeklyDraft> findAllByUserAuth(UserAuth userAuth);

    /** Ownership + existence check on a single draft. */
    @Query("SELECT d FROM WeeklyDraft d WHERE d.id = :id AND d.repo.userAuth = :userAuth")
    Optional<WeeklyDraft> findByIdAndUserAuth(Long id, UserAuth userAuth);

    /** Used when building weeklyGrid — fetch all drafts for this repo in one query. */
    List<WeeklyDraft> findAllByRepo(TrackedRepo repo);

    /** Used by the generate endpoint to check if a draft already exists for this week. */
    Optional<WeeklyDraft> findByRepoAndWeekOf(TrackedRepo repo, LocalDate weekOf);
}
