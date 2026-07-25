package com.autopost.autopost.repository;

import com.autopost.autopost.entity.TrackedRepo;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.entity.WeeklyNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyNoteRepository extends JpaRepository<WeeklyNote, Long> {

    /** All notes owned by the user. */
    List<WeeklyNote> findAllByUserAuth(UserAuth userAuth);

    /** Notes for a specific repo and week — used during draft generation. */
    List<WeeklyNote> findAllByRepoAndWeekOf(TrackedRepo repo, LocalDate weekOf);

    /** Ownership check on a single note. */
    Optional<WeeklyNote> findByIdAndUserAuth(Long id, UserAuth userAuth);
}
