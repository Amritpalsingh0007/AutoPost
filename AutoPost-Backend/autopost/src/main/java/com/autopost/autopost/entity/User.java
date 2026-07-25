package com.autopost.autopost.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Stores display profile data — separate from credentials in user_auth.
 * firstName / lastName are optional; the frontend only requires email at signup.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    private String firstName;
    private String lastName;

    // FK to the auth record that owns this profile
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_auth_id", nullable = false)
    private UserAuth userAuth;
}
