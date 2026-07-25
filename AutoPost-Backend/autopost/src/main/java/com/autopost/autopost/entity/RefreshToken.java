package com.autopost.autopost.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    /**
     * The opaque token value sent to the client.
     * Stored as a UUID string — not a JWT, so it can be revoked by deleting the row.
     */
    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private Instant expiresAt;

    /**
     * Soft-revocation flag. Set to true on logout or when the token is rotated.
     * Allows us to detect token reuse attacks (a revoked token being replayed).
     */
    @Column(nullable = false)
    private boolean revoked = false;

    /**
     * Many refresh tokens can belong to one user (multiple devices / sessions).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_auth_id", nullable = false)
    private UserAuth userAuth;


}
