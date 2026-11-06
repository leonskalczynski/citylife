package com.urbanpulse.dashboard.dto;

import com.urbanpulse.incidents.model.IncidentStatus;
import com.urbanpulse.incidents.model.Priority;

import java.time.Instant;
import java.util.UUID;

public record DashboardEventResponse(
        UUID incidentId,
        String title,
        IncidentStatus status,
        Priority priority,
        String categoryName,
        String district,
        String actorName,
        Instant changedAt
) {
}
