package com.autopost.autopost.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Matches the frontend AuthResponseDto type: { user, token, refreshToken } */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    private UserDto user;
    private String accessToken;
    private String refreshToken;
}
