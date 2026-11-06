package com.urbanpulse.auth.dto;

import com.urbanpulse.users.dto.CurrentUserResponse;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        CurrentUserResponse user
) {
}

