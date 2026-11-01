package com.citylife.incidents.dto;

import com.citylife.categories.dto.CategoryResponse;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;

import java.time.Instant;
import java.util.UUID;

public record IncidentResponse(
        UUID id,
        String title,
        String description,
        CategoryResponse category,
        IncidentStatus status,
        Priority priority,
        Double latitude,
        Double longitude,
        String address,
        String district,
        Instant createdAt,
        Instant updatedAt
) {
    public static IncidentResponse from(Incident incident) {
        return new IncidentResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                CategoryResponse.from(incident.getCategory()),
                incident.getStatus(),
                incident.getPriority(),
                incident.getLatitude(),
                incident.getLongitude(),
                incident.getAddress(),
                incident.getDistrict(),
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}
