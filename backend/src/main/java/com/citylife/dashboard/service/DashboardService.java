package com.citylife.dashboard.service;

import com.citylife.dashboard.dto.ActivityDayResponse;
import com.citylife.dashboard.dto.BreakdownResponse;
import com.citylife.dashboard.dto.CategoryBreakdownResponse;
import com.citylife.dashboard.dto.DashboardEventResponse;
import com.citylife.dashboard.dto.DashboardMapPointResponse;
import com.citylife.dashboard.dto.DashboardPulseResponse;
import com.citylife.dashboard.dto.DashboardResponse;
import com.citylife.dashboard.dto.DistrictBreakdownResponse;
import com.citylife.dashboard.dto.OperationalIndicatorsResponse;
import com.citylife.dashboard.dto.ResolutionStatsResponse;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.IncidentStatusChange;
import com.citylife.incidents.model.Priority;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.incidents.repository.IncidentStatusChangeRepository;
import com.citylife.shared.error.ResourceNotFoundException;
import com.citylife.users.model.Role;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class DashboardService {

    static final int MINIMUM_RESOLUTION_SAMPLES = 3;
    private static final Set<IncidentStatus> COMPLETED_STATUSES = EnumSet.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED);
    private static final Set<IncidentStatus> OPEN_EXCLUDED_STATUSES = EnumSet.of(IncidentStatus.REJECTED, IncidentStatus.RESOLVED, IncidentStatus.CLOSED);
    private static final int ACTIVITY_DAYS = 7;
    private static final int RECENT_EVENT_LIMIT = 8;
    private static final int MAP_POINT_LIMIT = 24;

    private final IncidentRepository incidentRepository;
    private final IncidentStatusChangeRepository statusChangeRepository;
    private final UserRepository userRepository;

    public DashboardService(
            IncidentRepository incidentRepository,
            IncidentStatusChangeRepository statusChangeRepository,
            UserRepository userRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.statusChangeRepository = statusChangeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Usuario no encontrado"));
        Scope scope = scopeFor(user);
        UUID createdById = scope.createdById();
        UUID assignedToId = scope.assignedToId();

        long totalIncidents = incidentRepository.countForDashboard(createdById, assignedToId);

        Map<IncidentStatus, Long> statusCounts = new EnumMap<>(IncidentStatus.class);
        incidentRepository.countByStatusForDashboard(createdById, assignedToId)
                .forEach(row -> statusCounts.put(row.getStatus(), row.getTotal()));

        Map<Priority, Long> priorityCounts = new EnumMap<>(Priority.class);
        incidentRepository.countByPriorityForDashboard(createdById, assignedToId)
                .forEach(row -> priorityCounts.put(row.getPriority(), row.getTotal()));

        List<CategoryBreakdownResponse> categoryBreakdown = incidentRepository
                .countByCategoryForDashboard(createdById, assignedToId)
                .stream()
                .map(row -> new CategoryBreakdownResponse(row.getCategoryId(), row.getCategoryName(), row.getTotal()))
                .sorted(Comparator.comparingLong(CategoryBreakdownResponse::count).reversed()
                        .thenComparing(CategoryBreakdownResponse::name))
                .toList();

        long assigned = count(statusCounts, IncidentStatus.ASSIGNED);
        long inProgress = count(statusCounts, IncidentStatus.IN_PROGRESS);
        long resolved = count(statusCounts, IncidentStatus.RESOLVED) + count(statusCounts, IncidentStatus.CLOSED);
        long urgentOpen = incidentRepository.countOpenByPriorityForDashboard(
                createdById,
                assignedToId,
                Priority.URGENT,
                OPEN_EXCLUDED_STATUSES
        );
        long assignedWithoutTechnician = incidentRepository.countWithoutTechnicianForDashboard(
                createdById,
                assignedToId,
                IncidentStatus.ASSIGNED
        );

        OperationalIndicatorsResponse indicators = new OperationalIndicatorsResponse(
                count(statusCounts, IncidentStatus.REPORTED),
                count(statusCounts, IncidentStatus.VALIDATED),
                assigned,
                inProgress,
                assigned + inProgress,
                urgentOpen,
                resolved,
                count(statusCounts, IncidentStatus.REJECTED),
                assignedWithoutTechnician
        );

        return new DashboardResponse(
                user.getRole(),
                totalIncidents,
                Arrays.stream(IncidentStatus.values())
                        .map(statusValue -> new BreakdownResponse(statusValue.name(), count(statusCounts, statusValue)))
                        .toList(),
                categoryBreakdown,
                Arrays.stream(Priority.values())
                        .map(priorityValue -> new BreakdownResponse(priorityValue.name(), count(priorityCounts, priorityValue)))
                        .toList(),
                resolutionStats(createdById, assignedToId),
                indicators,
                pulse(scope, statusCounts, totalIncidents)
        );
    }

    private DashboardPulseResponse pulse(Scope scope, Map<IncidentStatus, Long> statusCounts, long totalIncidents) {
        Instant now = Instant.now();
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = now.atZone(zone).toLocalDate();
        Instant startOfToday = today.atStartOfDay(zone).toInstant();
        Instant startOfTomorrow = today.plusDays(1).atStartOfDay(zone).toInstant();
        Instant startOfWeek = today.minusDays(ACTIVITY_DAYS - 1L).atStartOfDay(zone).toInstant();
        Instant startOfPreviousWeek = today.minusDays(ACTIVITY_DAYS * 2L - 1L).atStartOfDay(zone).toInstant();

        long createdToday = 0;
        long resolvedToday = 0;
        long createdLast7Days = 0;
        long resolvedLast7Days = 0;
        long createdPrevious7Days = 0;
        long resolvedPrevious7Days = 0;

        Map<LocalDate, long[]> activityByDay = new LinkedHashMap<>();
        for (int offset = ACTIVITY_DAYS - 1; offset >= 0; offset--) {
            activityByDay.put(today.minusDays(offset), new long[]{0, 0});
        }

        for (IncidentRepository.ActivitySample sample : incidentRepository.findActivitySamplesForDashboard(
                scope.createdById(), scope.assignedToId(), startOfPreviousWeek)) {
            Instant createdAt = sample.getCreatedAt();
            if (createdAt != null) {
                if (!createdAt.isBefore(startOfToday) && createdAt.isBefore(startOfTomorrow)) createdToday++;
                if (!createdAt.isBefore(startOfWeek) && !createdAt.isAfter(now)) {
                    createdLast7Days++;
                    increment(activityByDay, createdAt, zone, 0);
                } else if (!createdAt.isBefore(startOfPreviousWeek) && createdAt.isBefore(startOfWeek)) {
                    createdPrevious7Days++;
                }
            }
            Instant resolvedAt = sample.getResolvedAt();
            if (resolvedAt != null) {
                if (!resolvedAt.isBefore(startOfToday) && resolvedAt.isBefore(startOfTomorrow)) resolvedToday++;
                if (!resolvedAt.isBefore(startOfWeek) && !resolvedAt.isAfter(now)) {
                    resolvedLast7Days++;
                    increment(activityByDay, resolvedAt, zone, 1);
                } else if (!resolvedAt.isBefore(startOfPreviousWeek) && resolvedAt.isBefore(startOfWeek)) {
                    resolvedPrevious7Days++;
                }
            }
        }

        List<ActivityDayResponse> activity = activityByDay.entrySet().stream()
                .map(entry -> new ActivityDayResponse(entry.getKey(), entry.getValue()[0], entry.getValue()[1]))
                .toList();

        List<DashboardEventResponse> recentEvents = statusChangeRepository
                .findRecentForDashboard(scope.createdById(), scope.assignedToId(), PageRequest.of(0, RECENT_EVENT_LIMIT))
                .stream()
                .map(this::toEvent)
                .toList();

        List<DistrictBreakdownResponse> byDistrict = incidentRepository
                .countByDistrictForDashboard(scope.createdById(), scope.assignedToId())
                .stream()
                .map(row -> new DistrictBreakdownResponse(normalizeDistrict(row.getDistrict()), row.getTotal()))
                .toList();

        List<DashboardMapPointResponse> mapPoints = incidentRepository
                .findMapPointsForDashboard(scope.createdById(), scope.assignedToId(), PageRequest.of(0, MAP_POINT_LIMIT))
                .stream()
                .map(this::toMapPoint)
                .toList();

        long activeIncidents = totalIncidents
                - count(statusCounts, IncidentStatus.RESOLVED)
                - count(statusCounts, IncidentStatus.CLOSED)
                - count(statusCounts, IncidentStatus.REJECTED);

        return new DashboardPulseResponse(
                activeIncidents,
                createdToday,
                resolvedToday,
                createdLast7Days,
                resolvedLast7Days,
                createdPrevious7Days,
                resolvedPrevious7Days,
                activity,
                recentEvents,
                byDistrict,
                mapPoints
        );
    }

    private void increment(Map<LocalDate, long[]> activityByDay, Instant instant, ZoneId zone, int index) {
        long[] bucket = activityByDay.get(instant.atZone(zone).toLocalDate());
        if (bucket != null) bucket[index]++;
    }

    private DashboardEventResponse toEvent(IncidentStatusChange change) {
        Incident incident = change.getIncident();
        return new DashboardEventResponse(
                incident.getId(),
                incident.getTitle(),
                change.getNewStatus(),
                incident.getPriority(),
                incident.getCategory().getName(),
                normalizeDistrict(incident.getDistrict()),
                change.getChangedBy().getDisplayName(),
                change.getChangedAt()
        );
    }

    private DashboardMapPointResponse toMapPoint(Incident incident) {
        return new DashboardMapPointResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getLatitude(),
                incident.getLongitude(),
                incident.getStatus(),
                incident.getPriority(),
                incident.getCategory().getName()
        );
    }

    private String normalizeDistrict(String district) {
        return district == null || district.isBlank() ? "Sin distrito" : district;
    }

    private ResolutionStatsResponse resolutionStats(UUID createdById, UUID assignedToId) {
        List<Long> durations = incidentRepository.findResolutionSamplesForDashboard(createdById, assignedToId)
                .stream()
                .map(sample -> Duration.between(sample.getCreatedAt(), sample.getResolvedAt()).getSeconds())
                .filter(seconds -> seconds >= 0)
                .toList();

        Long averageSeconds = durations.size() < MINIMUM_RESOLUTION_SAMPLES
                ? null
                : Math.round(durations.stream().mapToLong(Long::longValue).average().orElse(0));
        return new ResolutionStatsResponse(durations.size(), MINIMUM_RESOLUTION_SAMPLES, averageSeconds);
    }

    private Scope scopeFor(User user) {
        return switch (user.getRole()) {
            case CITIZEN -> new Scope(user.getId(), null);
            case TECHNICIAN -> new Scope(null, user.getId());
            case OPERATOR -> new Scope(null, null);
            case ADMIN, ANALYST -> throw new AccessDeniedException("El panel no está disponible para este rol");
        };
    }

    private long count(Map<?, Long> counts, Enum<?> key) {
        return counts.getOrDefault(key, 0L);
    }

    private record Scope(UUID createdById, UUID assignedToId) {
    }
}
