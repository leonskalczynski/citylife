package com.urbanpulse.incidents.model;

import com.urbanpulse.categories.model.Category;
import com.urbanpulse.departments.model.Department;
import com.urbanpulse.shared.error.InvalidIncidentTransitionException;
import com.urbanpulse.users.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    private UUID id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IncidentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority;

    private Double latitude;

    private Double longitude;

    @Column(length = 200)
    private String address;

    @Column(length = 100)
    private String district;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "technician_notes", length = 2000)
    private String technicianNotes;

    @Column(name = "resolution_summary", length = 2000)
    private String resolutionSummary;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Incident() {
    }

    public Incident(
            String title,
            String description,
            Category category,
            Double latitude,
            Double longitude,
            String address,
            String district,
            User createdBy
    ) {
        this.id = UUID.randomUUID();
        this.title = title.trim();
        this.description = description.trim();
        this.category = category;
        this.status = IncidentStatus.REPORTED;
        this.priority = Priority.NORMAL;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = trimToNull(address);
        this.district = trimToNull(district);
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    @PrePersist
    void prepareForPersistence() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void updateTimestamp() {
        updatedAt = Instant.now();
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    public void validateIncident() {
        requireStatus(IncidentStatus.REPORTED, IncidentStatus.VALIDATED);
        status = IncidentStatus.VALIDATED;
        rejectionReason = null;
    }

    public void reject(String reason) {
        requireStatus(IncidentStatus.REPORTED, IncidentStatus.REJECTED);
        status = IncidentStatus.REJECTED;
        rejectionReason = reason.trim();
    }

    public void changePriority(Priority newPriority) {
        if (status == IncidentStatus.REJECTED || status == IncidentStatus.CLOSED) {
            throw new InvalidIncidentTransitionException(
                    "No se puede cambiar la prioridad de una incidencia en estado " + status
            );
        }
        priority = newPriority;
    }

    public void assign(Department newDepartment, User technician) {
        if (status != IncidentStatus.VALIDATED && status != IncidentStatus.ASSIGNED) {
            throw new InvalidIncidentTransitionException(
                    "No se puede asignar una incidencia en estado " + status
            );
        }
        department = newDepartment;
        assignedTo = technician;
        status = IncidentStatus.ASSIGNED;
    }

    public void startWork() {
        requireStatus(IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS);
        status = IncidentStatus.IN_PROGRESS;
    }

    public void updateTechnicianNotes(String notes) {
        if (status != IncidentStatus.ASSIGNED && status != IncidentStatus.IN_PROGRESS) {
            throw new InvalidIncidentTransitionException(
                    "No se puede documentar una incidencia en estado " + status
            );
        }
        technicianNotes = trimToNull(notes);
    }

    public void resolve(String summary) {
        requireStatus(IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED);
        resolutionSummary = summary.trim();
        resolvedAt = Instant.now();
        status = IncidentStatus.RESOLVED;
    }

    private void requireStatus(IncidentStatus expected, IncidentStatus target) {
        if (status != expected) {
            throw new InvalidIncidentTransitionException(
                    "No se puede cambiar una incidencia de " + status + " a " + target
            );
        }
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Category getCategory() { return category; }
    public IncidentStatus getStatus() { return status; }
    public Priority getPriority() { return priority; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getAddress() { return address; }
    public String getDistrict() { return district; }
    public User getCreatedBy() { return createdBy; }
    public Department getDepartment() { return department; }
    public User getAssignedTo() { return assignedTo; }
    public String getRejectionReason() { return rejectionReason; }
    public String getTechnicianNotes() { return technicianNotes; }
    public String getResolutionSummary() { return resolutionSummary; }
    public Instant getResolvedAt() { return resolvedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
