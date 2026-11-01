package com.citylife.dashboard.dto;

import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;

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
