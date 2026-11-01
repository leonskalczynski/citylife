package com.citylife.incidents.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignIncidentRequest(
        @NotNull(message = "Selecciona un departamento") UUID departmentId,
        UUID technicianId
) {
}
