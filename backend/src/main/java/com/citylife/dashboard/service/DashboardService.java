package com.citylife.dashboard.service;

import com.citylife.dashboard.dto.BreakdownResponse;
import com.citylife.dashboard.dto.CategoryBreakdownResponse;
import com.citylife.dashboard.dto.DashboardResponse;
import com.citylife.dashboard.dto.OperationalIndicatorsResponse;
import com.citylife.dashboard.dto.ResolutionStatsResponse;
import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.shared.error.ResourceNotFoundException;
import com.citylife.users.model.Role;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class DashboardService {

    static final int MINIMUM_RESOLUTION_SAMPLES = 3;
    private static final Set<IncidentStatus> COMPLETED_STATUSES = EnumSet.of(IncidentStatus.RESOLVED, IncidentStatus.CLOSED);
    private static final Set<IncidentStatus> OPEN_EXCLUDED_STATUSES = EnumSet.of(IncidentStatus.REJECTED, IncidentStatus.RESOLVED, IncidentStatus.CLOSED);

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public DashboardService(IncidentRepository incidentRepository, UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
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
                indicators
        );
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
