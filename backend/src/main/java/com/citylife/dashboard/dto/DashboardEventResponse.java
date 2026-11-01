package com.citylife.dashboard.dto;

import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;

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
