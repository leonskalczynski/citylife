package com.urbanpulse.shared.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        int status,
        String code,
        String message,
        Instant timestamp,
        Map<String, String> fieldErrors
) {
    public static ApiError of(int status, String code, String message) {
        return new ApiError(status, code, message, Instant.now(), Map.of());
    }
}

