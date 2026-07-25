package com.autopost.autopost.repository;

import com.autopost.autopost.entity.User;
import com.autopost.autopost.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUserAuth(UserAuth userAuth);
}
