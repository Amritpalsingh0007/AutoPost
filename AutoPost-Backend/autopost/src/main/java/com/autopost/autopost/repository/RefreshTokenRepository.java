package com.autopost.autopost.repository;

import com.autopost.autopost.entity.RefreshToken;
import com.autopost.autopost.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

    Optional<RefreshToken> findByToken(String token);

    /** Revoke all active refresh tokens for a user — used on logout. */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userAuth = :userAuth AND rt.revoked = false")
    void revokeAllByUserAuth(UserAuth userAuth);
}
