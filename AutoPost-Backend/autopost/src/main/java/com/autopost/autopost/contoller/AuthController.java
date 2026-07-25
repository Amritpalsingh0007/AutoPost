package com.autopost.autopost.contoller;

import com.autopost.autopost.dto.request.LoginRequestDto;
import com.autopost.autopost.dto.request.RefreshRequestDto;
import com.autopost.autopost.dto.request.SignupRequestDto;
import com.autopost.autopost.dto.request.UpdatePasswordRequestDto;
import com.autopost.autopost.dto.response.AuthResponseDto;
import com.autopost.autopost.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/signup — { email, password } → AuthResponseDto (201) */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponseDto> signup(@Valid @RequestBody SignupRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    /** POST /api/auth/login — { email, password } → AuthResponseDto (200) */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** POST /api/auth/refresh — { refreshToken } → AuthResponseDto (200) */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refresh(@RequestBody RefreshRequestDto request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    /** POST /api/auth/logout — { refreshToken } → 204 */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshRequestDto request) {
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }

    /** PUT /api/auth/password — { currentPassword, newPassword } → 200 */
    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdatePasswordRequestDto request) {
        authService.updatePassword(principal.getUsername(), request);
        return ResponseEntity.ok().build();
    }

    /** DELETE /api/auth/account — 204. User resolved from JWT, not from body. */
    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal UserDetails principal) {
        authService.deleteAccount(principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
