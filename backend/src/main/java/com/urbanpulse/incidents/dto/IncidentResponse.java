package com.urbanpulse.incidents.dto;

import com.urbanpulse.categories.dto.CategoryResponse;
import com.urbanpulse.incidents.model.Incident;
import com.urbanpulse.incidents.model.IncidentStatus;
import com.urbanpulse.incidents.model.Priority;
import com.urbanpulse.departments.dto.DepartmentResponse;
import com.urbanpulse.users.dto.UserSummaryResponse;

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
        UserSummaryResponse createdBy,
        DepartmentResponse department,
        UserSummaryResponse assignedTo,
        String rejectionReason,
        String technicianNotes,
        String resolutionSummary,
        Instant resolvedAt,
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
                UserSummaryResponse.from(incident.getCreatedBy()),
                incident.getDepartment() == null ? null : DepartmentResponse.from(incident.getDepartment()),
                incident.getAssignedTo() == null ? null : UserSummaryResponse.from(incident.getAssignedTo()),
                incident.getRejectionReason(),
                incident.getTechnicianNotes(),
                incident.getResolutionSummary(),
                incident.getResolvedAt(),
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}
