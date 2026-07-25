package com.autopost.autopost.service;

import com.autopost.autopost.dto.request.LoginRequestDto;
import com.autopost.autopost.dto.request.RefreshRequestDto;
import com.autopost.autopost.dto.request.SignupRequestDto;
import com.autopost.autopost.dto.request.UpdatePasswordRequestDto;
import com.autopost.autopost.dto.response.AuthResponseDto;
import com.autopost.autopost.dto.response.UserDto;
import com.autopost.autopost.entity.RefreshToken;
import com.autopost.autopost.entity.User;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.repository.UserAuthRepository;
import com.autopost.autopost.repository.UserProfileRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserAuthRepository userAuthRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserAuthRepository userAuthRepository,
                       UserProfileRepository userProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       RefreshTokenService refreshTokenService) {
        this.userAuthRepository = userAuthRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.refreshTokenService = refreshTokenService;
    }

    // -------------------------------------------------------------------------
    // Signup
    // -------------------------------------------------------------------------

    @Transactional
    public AuthResponseDto signup(SignupRequestDto request) {
        if (userAuthRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyUsedException("Email already in use");
        }

        UserAuth userAuth = UserAuth.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        userAuth = userAuthRepository.save(userAuth);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .userAuth(userAuth)
                .build();
        userProfileRepository.save(user);

        return buildAuthResponse(userAuth);
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    @Transactional
    public AuthResponseDto login(LoginRequestDto request) {
        // Throws AuthenticationException on bad credentials — Spring Security handles it
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserAuth userAuth = userAuthRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found after authentication"));

        return buildAuthResponse(userAuth);
    }

    // -------------------------------------------------------------------------
    // Token refresh (rotation)
    // -------------------------------------------------------------------------

    @Transactional
    public AuthResponseDto refresh(RefreshRequestDto request) {
        RefreshToken existing = refreshTokenService.validate(request.getRefreshToken());
        RefreshToken rotated = refreshTokenService.rotate(existing);
        String newAccessToken = jwtService.generateToken(rotated.getUserAuth().getEmail());
        return AuthResponseDto.builder()
                .user(toUserDto(rotated.getUserAuth()))
                .accessToken(newAccessToken)
                .refreshToken(rotated.getToken())
                .build();
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------

    @Transactional
    public void logout(RefreshRequestDto request) {
        RefreshToken existing = refreshTokenService.validate(request.getRefreshToken());
        refreshTokenService.revokeAll(existing.getUserAuth());
    }

    // -------------------------------------------------------------------------
    // Change password
    // -------------------------------------------------------------------------

    @Transactional
    public void updatePassword(String email, UpdatePasswordRequestDto request) {
        UserAuth userAuth = userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), userAuth.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        userAuth.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userAuthRepository.save(userAuth);

        // Invalidate all existing refresh tokens — user must log in again
        refreshTokenService.revokeAll(userAuth);
    }

    // -------------------------------------------------------------------------
    // Delete account
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteAccount(String email) {
        UserAuth userAuth = userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Cascade in UserAuth entity handles User profile deletion.
        // TrackedRepo, WeeklyDraft, WeeklyNote are cascade-deleted via their entity configs.
        userAuthRepository.delete(userAuth);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private AuthResponseDto buildAuthResponse(UserAuth userAuth) {
        String accessToken = jwtService.generateToken(userAuth.getEmail());
        RefreshToken refreshToken = refreshTokenService.issue(userAuth);
        return AuthResponseDto.builder()
                .user(toUserDto(userAuth))
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    private UserDto toUserDto(UserAuth userAuth) {
        return UserDto.builder()
                .id(userAuth.getId())
                .email(userAuth.getEmail())
                .createdAt(userAuth.getCreatedAt())
                .build();
    }

    // -------------------------------------------------------------------------
    // Typed exception for 409 mapping
    // -------------------------------------------------------------------------

    public static class EmailAlreadyUsedException extends RuntimeException {
        public EmailAlreadyUsedException(String message) {
            super(message);
        }
    }
}
