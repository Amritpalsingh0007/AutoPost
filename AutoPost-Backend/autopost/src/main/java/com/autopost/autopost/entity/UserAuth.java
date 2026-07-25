package com.autopost.autopost.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_auth")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAuth {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    /**
     * Email is the public-facing login identifier (what the frontend sends).
     * Stored here in user_auth so Spring Security can look it up directly.
     */
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    // Inverse side — one UserAuth has one User profile
    @OneToOne(mappedBy = "userAuth", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private User user;
}
