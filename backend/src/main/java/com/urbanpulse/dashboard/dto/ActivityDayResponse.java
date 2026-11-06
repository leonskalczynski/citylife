package com.urbanpulse.dashboard.dto;

import java.time.LocalDate;

public record ActivityDayResponse(
        LocalDate date,
        long created,
        long resolved
) {
}
