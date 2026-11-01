package com.citylife.users.dto;

import com.citylife.users.model.Role;
import com.citylife.users.model.User;

import java.util.UUID;

public record UserSummaryResponse(UUID id, String displayName, String email, Role role) {

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(user.getId(), user.getDisplayName(), user.getEmail(), user.getRole());
    }
}
