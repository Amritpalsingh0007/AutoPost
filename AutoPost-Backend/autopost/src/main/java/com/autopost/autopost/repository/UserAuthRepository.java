package com.autopost.autopost.repository;

import com.autopost.autopost.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuth, Integer> {
    Optional<UserAuth> findByEmail(String email);
    boolean existsByEmail(String email);
}
