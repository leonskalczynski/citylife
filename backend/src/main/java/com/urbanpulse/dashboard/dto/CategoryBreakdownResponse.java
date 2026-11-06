package com.urbanpulse.dashboard.dto;

import java.util.UUID;

public record CategoryBreakdownResponse(UUID id, String name, long count) {
}
