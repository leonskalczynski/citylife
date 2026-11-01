package com.citylife.incidents.dto;

import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.IncidentStatusChange;

import java.time.Instant;
import java.util.UUID;

public record IncidentStatusChangeResponse(
        UUID id,
        IncidentStatus previousStatus,
        IncidentStatus newStatus,
        HistoryActorResponse changedBy,
        String reason,
        Instant changedAt
) {
    public static IncidentStatusChangeResponse from(IncidentStatusChange change) {
        return new IncidentStatusChangeResponse(
                change.getId(),
                change.getPreviousStatus(),
                change.getNewStatus(),
                HistoryActorResponse.from(change.getChangedBy()),
                change.getReason(),
                change.getChangedAt()
        );
    }
}
