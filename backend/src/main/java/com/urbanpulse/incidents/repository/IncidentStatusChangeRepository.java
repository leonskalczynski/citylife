package com.urbanpulse.incidents.repository;

import com.urbanpulse.incidents.model.Incident;
import com.urbanpulse.incidents.model.IncidentStatusChange;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface IncidentStatusChangeRepository extends JpaRepository<IncidentStatusChange, UUID> {

    List<IncidentStatusChange> findAllByIncidentOrderByChangedAtAsc(Incident incident);

    @Query("""
            select c
            from IncidentStatusChange c
            where (:createdById is null or c.incident.createdBy.id = :createdById)
              and (:assignedToId is null or c.incident.assignedTo.id = :assignedToId)
            order by c.changedAt desc
            """)
    List<IncidentStatusChange> findRecentForDashboard(
            @Param("createdById") UUID createdById,
            @Param("assignedToId") UUID assignedToId,
            Pageable pageable
    );
}
