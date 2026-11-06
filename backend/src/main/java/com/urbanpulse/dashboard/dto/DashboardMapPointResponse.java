package com.urbanpulse.dashboard.dto;

import com.urbanpulse.incidents.model.IncidentStatus;
import com.urbanpulse.incidents.model.Priority;

import java.util.UUID;

public record DashboardMapPointResponse(
        UUID id,
        String title,
        double latitude,
        double longitude,
        IncidentStatus status,
        Priority priority,
        String categoryName
) {
}
