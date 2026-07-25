package com.autopost.autopost.repository;

import com.autopost.autopost.entity.TrackedRepo;
import com.autopost.autopost.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrackedRepoRepository extends JpaRepository<TrackedRepo, Long> {

    List<TrackedRepo> findAllByUserAuth(UserAuth userAuth);

    /** Used for ownership check: repo must exist AND belong to this user. */
    Optional<TrackedRepo> findByIdAndUserAuth(Long id, UserAuth userAuth);

    boolean existsByRepoUrlAndUserAuth(String repoUrl, UserAuth userAuth);
}
