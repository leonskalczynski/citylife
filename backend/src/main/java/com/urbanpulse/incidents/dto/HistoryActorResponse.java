package com.urbanpulse.incidents.dto;

import com.urbanpulse.users.model.Role;
import com.urbanpulse.users.model.User;

import java.util.UUID;

public record HistoryActorResponse(
        UUID id,
        String displayName,
        Role role
) {
    public static HistoryActorResponse from(User user) {
        return new HistoryActorResponse(user.getId(), user.getDisplayName(), user.getRole());
    }
}
