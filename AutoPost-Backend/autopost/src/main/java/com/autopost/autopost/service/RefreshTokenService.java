package com.autopost.autopost.service;

import com.autopost.autopost.entity.RefreshToken;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${jwt.refreshTokenExpiryDays:7}")
    private long refreshTokenExpiryDays;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Creates and persists a new refresh token for the given user.
     * Called after a successful login or signup.
     */
    @Transactional
    public RefreshToken issue(UserAuth userAuth) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userAuth(userAuth)
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpiryDays * 24 * 60 * 60))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Validates the token string against the database.
     * Throws if:
     *  - token not found
     *  - token has been revoked (possible replay attack)
     *  - token has expired
     */
    public RefreshToken validate(String tokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new IllegalStateException("Refresh token has been revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Refresh token has expired");
        }

        return refreshToken;
    }

    /**
     * Token rotation: revoke the old token and issue a fresh one.
     * This limits the window of exposure if a refresh token is stolen.
     */
    @Transactional
    public RefreshToken rotate(RefreshToken old) {
        old.setRevoked(true);
        refreshTokenRepository.save(old);
        return issue(old.getUserAuth());
    }

    /**
     * Revokes all active refresh tokens for the user — called on logout.
     * Using a bulk JPQL update avoids loading every token into memory.
     */
    @Transactional
    public void revokeAll(UserAuth userAuth) {
        refreshTokenRepository.revokeAllByUserAuth(userAuth);
    }
}
