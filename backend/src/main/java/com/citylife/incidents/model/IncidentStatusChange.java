package com.citylife.incidents.model;

import com.citylife.users.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_status_changes")
public class IncidentStatusChange {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private IncidentStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private IncidentStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by_id", nullable = false)
    private User changedBy;

    @Column(length = 2000)
    private String reason;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    protected IncidentStatusChange() {
    }

    public IncidentStatusChange(
            Incident incident,
            IncidentStatus previousStatus,
            IncidentStatus newStatus,
            User changedBy,
            String reason
    ) {
        this.id = UUID.randomUUID();
        this.incident = incident;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.reason = trimToNull(reason);
        this.changedAt = Instant.now();
    }

    @PrePersist
    void prepareForPersistence() {
        if (id == null) id = UUID.randomUUID();
        if (changedAt == null) changedAt = Instant.now();
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public UUID getId() { return id; }
    public IncidentStatus getPreviousStatus() { return previousStatus; }
    public IncidentStatus getNewStatus() { return newStatus; }
    public User getChangedBy() { return changedBy; }
    public String getReason() { return reason; }
    public Instant getChangedAt() { return changedAt; }
}
