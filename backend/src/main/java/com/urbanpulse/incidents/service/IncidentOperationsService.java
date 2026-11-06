package com.urbanpulse.incidents.service;

import com.urbanpulse.departments.model.Department;
import com.urbanpulse.departments.repository.DepartmentRepository;
import com.urbanpulse.incidents.dto.AssignIncidentRequest;
import com.urbanpulse.incidents.dto.ChangePriorityRequest;
import com.urbanpulse.incidents.dto.IncidentResponse;
import com.urbanpulse.incidents.dto.PageResponse;
import com.urbanpulse.incidents.dto.RejectIncidentRequest;
import com.urbanpulse.incidents.model.Incident;
import com.urbanpulse.incidents.model.IncidentStatus;
import com.urbanpulse.incidents.model.Priority;
import com.urbanpulse.incidents.repository.IncidentRepository;
import com.urbanpulse.shared.error.ResourceNotFoundException;
import com.urbanpulse.users.model.Role;
import com.urbanpulse.users.model.User;
import com.urbanpulse.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Service
public class IncidentOperationsService {

    private static final Logger log = LoggerFactory.getLogger(IncidentOperationsService.class);

    private final IncidentRepository incidentRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final IncidentAuditService auditService;

    public IncidentOperationsService(
            IncidentRepository incidentRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            IncidentAuditService auditService
    ) {
        this.incidentRepository = incidentRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentResponse> search(
            IncidentStatus status,
            Priority priority,
            UUID categoryId,
            UUID departmentId,
            String district,
            String search,
            Boolean withoutTechnician,
            String sort,
            String direction,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                sortFor(sort, direction)
        );
        Page<IncidentResponse> result = incidentRepository.findAll(
                        operationFilters(status, priority, categoryId, departmentId, district, search, withoutTechnician),
                        pageable
                )
                .map(IncidentResponse::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public IncidentResponse get(UUID incidentId) {
        return IncidentResponse.from(getIncident(incidentId));
    }

    @Transactional
    public IncidentResponse validate(UUID incidentId, String operatorEmail) {
        Incident incident = getIncident(incidentId);
        IncidentStatus previousStatus = incident.getStatus();
        incident.validateIncident();
        auditService.record(incident, previousStatus, getUser(operatorEmail), null);
        log.info("Incident {} validated", incidentId);
        return IncidentResponse.from(incident);
    }

    @Transactional
    public IncidentResponse reject(UUID incidentId, String operatorEmail, RejectIncidentRequest request) {
        Incident incident = getIncident(incidentId);
        IncidentStatus previousStatus = incident.getStatus();
        incident.reject(request.reason());
        auditService.record(incident, previousStatus, getUser(operatorEmail), request.reason());
        log.info("Incident {} rejected", incidentId);
        return IncidentResponse.from(incident);
    }

    @Transactional
    public IncidentResponse changePriority(UUID incidentId, ChangePriorityRequest request) {
        Incident incident = getIncident(incidentId);
        incident.changePriority(request.priority());
        log.info("Incident {} priority changed to {}", incidentId, request.priority());
        return IncidentResponse.from(incident);
    }

    @Transactional
    public IncidentResponse assign(UUID incidentId, String operatorEmail, AssignIncidentRequest request) {
        Incident incident = getIncident(incidentId);
        IncidentStatus previousStatus = incident.getStatus();
        Department department = departmentRepository.findById(request.departmentId())
                .filter(Department::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("DEPARTMENT_NOT_FOUND", "Departamento no encontrado"));
        User technician = request.technicianId() == null ? null : getTechnician(request.technicianId());
        incident.assign(department, technician);
        auditService.record(incident, previousStatus, getUser(operatorEmail), null);
        log.info("Incident {} assigned to department {} and technician {}", incidentId, department.getId(), technician == null ? null : technician.getId());
        return IncidentResponse.from(incident);
    }

    private Incident getIncident(UUID incidentId) {
        return incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
    }

    private User getTechnician(UUID technicianId) {
        User user = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("TECHNICIAN_NOT_FOUND", "Técnico no encontrado"));
        if (!user.isEnabled() || user.getRole() != Role.TECHNICIAN) {
            throw new ResourceNotFoundException("TECHNICIAN_NOT_FOUND", "Técnico no encontrado");
        }
        return user;
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Usuario no encontrado"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Specification<Incident> operationFilters(
            IncidentStatus status,
            Priority priority,
            UUID categoryId,
            UUID departmentId,
            String district,
            String search,
            Boolean withoutTechnician
    ) {
        String normalizedDistrict = normalize(district);
        String normalizedSearch = normalize(search);

        return (root, query, criteriaBuilder) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(criteriaBuilder.equal(root.get("priority"), priority));
            }
            if (categoryId != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
            }
            if (departmentId != null) {
                predicates.add(criteriaBuilder.equal(root.get("department").get("id"), departmentId));
            }
            if (normalizedDistrict != null) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("district")), "%" + normalizedDistrict + "%"));
            }
            if (Boolean.TRUE.equals(withoutTechnician)) {
                predicates.add(criteriaBuilder.isNull(root.get("assignedTo")));
            }
            if (normalizedSearch != null) {
                String pattern = "%" + normalizedSearch + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
                ));
            }
            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private Sort sortFor(String sort, String direction) {
        String property = switch (sort == null ? "createdAt" : sort) {
            case "title" -> "title";
            case "status" -> "status";
            case "priority" -> "priority";
            case "category" -> "category.name";
            case "department" -> "department.name";
            case "district" -> "district";
            default -> "createdAt";
        };
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sortDirection, property);
    }

    private String normalize(String value) {
        String normalized = blankToNull(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }
}
