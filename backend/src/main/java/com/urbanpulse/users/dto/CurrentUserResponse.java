package com.urbanpulse.users.dto;

import com.urbanpulse.users.model.Role;
import com.urbanpulse.users.model.User;

import java.util.UUID;

public record CurrentUserResponse(UUID id, String email, String displayName, Role role) {

    public static CurrentUserResponse from(User user) {
        return new CurrentUserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}

