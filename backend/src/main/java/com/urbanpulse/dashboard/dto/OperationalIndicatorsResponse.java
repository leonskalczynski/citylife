package com.urbanpulse.dashboard.dto;

public record OperationalIndicatorsResponse(
        long awaitingValidation,
        long awaitingAssignment,
        long awaitingStart,
        long inProgress,
        long activeWork,
        long urgentOpen,
        long resolved,
        long rejected,
        long assignedWithoutTechnician
) {
}
