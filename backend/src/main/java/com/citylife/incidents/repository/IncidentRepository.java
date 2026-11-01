package com.citylife.incidents.repository;

import com.citylife.incidents.model.Incident;
import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;
import com.citylife.users.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID>, JpaSpecificationExecutor<Incident> {

    List<Incident> findAllByCreatedByOrderByCreatedAtDesc(User createdBy);

    Optional<Incident> findByIdAndCreatedBy(UUID id, User createdBy);

    List<Incident> findAllByAssignedToOrderByUpdatedAtDesc(User assignedTo);

    Optional<Incident> findByIdAndAssignedTo(UUID id, User assignedTo);

    long countByCreatedBy(User createdBy);

    @Query("""
            select count(i)
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
            """)
    long countForDashboard(@Param("createdById") UUID createdById, @Param("assignedToId") UUID assignedToId);

    @Query("""
            select i.status as status, count(i) as total
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
            group by i.status
            """)
    List<StatusCount> countByStatusForDashboard(@Param("createdById") UUID createdById, @Param("assignedToId") UUID assignedToId);

    @Query("""
            select i.category.id as categoryId, i.category.name as categoryName, count(i) as total
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
            group by i.category.id, i.category.name
            """)
    List<CategoryCount> countByCategoryForDashboard(@Param("createdById") UUID createdById, @Param("assignedToId") UUID assignedToId);

    @Query("""
            select i.priority as priority, count(i) as total
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
            group by i.priority
            """)
    List<PriorityCount> countByPriorityForDashboard(@Param("createdById") UUID createdById, @Param("assignedToId") UUID assignedToId);

    @Query("""
            select count(i)
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
              and i.priority = :priority
              and i.status not in :excludedStatuses
            """)
    long countOpenByPriorityForDashboard(
            @Param("createdById") UUID createdById,
            @Param("assignedToId") UUID assignedToId,
            @Param("priority") Priority priority,
            @Param("excludedStatuses") Collection<IncidentStatus> excludedStatuses
    );

    @Query("""
            select count(i)
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
              and i.status = :status
              and i.assignedTo is null
            """)
    long countWithoutTechnicianForDashboard(
            @Param("createdById") UUID createdById,
            @Param("assignedToId") UUID assignedToId,
            @Param("status") IncidentStatus status
    );

    @Query("""
            select i.createdAt as createdAt, i.resolvedAt as resolvedAt
            from Incident i
            where i.resolvedAt is not null
              and (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
            """)
    List<ResolutionSample> findResolutionSamplesForDashboard(@Param("createdById") UUID createdById, @Param("assignedToId") UUID assignedToId);

    @Query("""
            select i.createdAt as createdAt, i.resolvedAt as resolvedAt
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
              and (i.createdAt >= :from or i.resolvedAt >= :from)
            """)
    List<ActivitySample> findActivitySamplesForDashboard(
            @Param("createdById") UUID createdById,
            @Param("assignedToId") UUID assignedToId,
            @Param("from") Instant from
    );

    @Query("""
            select i.district as district, count(i) as total
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
            group by i.district
            order by count(i) desc
            """)
    List<DistrictCount> countByDistrictForDashboard(
            @Param("createdById") UUID createdById,
            @Param("assignedToId") UUID assignedToId
    );

    @Query("""
            select i
            from Incident i
            where (:createdById is null or i.createdBy.id = :createdById)
              and (:assignedToId is null or i.assignedTo.id = :assignedToId)
              and i.latitude is not null
              and i.longitude is not null
            order by i.updatedAt desc
            """)
    List<Incident> findMapPointsForDashboard(
            @Param("createdById") UUID createdById,
            @Param("assignedToId") UUID assignedToId,
            Pageable pageable
    );

    interface StatusCount {
        IncidentStatus getStatus();
        long getTotal();
    }

    interface PriorityCount {
        Priority getPriority();
        long getTotal();
    }

    interface CategoryCount {
        UUID getCategoryId();
        String getCategoryName();
        long getTotal();
    }

    interface DistrictCount {
        String getDistrict();
        long getTotal();
    }

    interface ResolutionSample {
        Instant getCreatedAt();
        Instant getResolvedAt();
    }

    interface ActivitySample {
        Instant getCreatedAt();
        Instant getResolvedAt();
    }

}
