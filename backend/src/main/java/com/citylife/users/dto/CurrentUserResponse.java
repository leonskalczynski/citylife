package com.citylife.users.dto;

import com.citylife.users.model.Role;
import com.citylife.users.model.User;

import java.util.UUID;

public record CurrentUserResponse(UUID id, String email, String displayName, Role role) {

    public static CurrentUserResponse from(User user) {
        return new CurrentUserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}

