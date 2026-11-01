package com.citylife.auth.dto;

import com.citylife.users.dto.CurrentUserResponse;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        CurrentUserResponse user
) {
}

