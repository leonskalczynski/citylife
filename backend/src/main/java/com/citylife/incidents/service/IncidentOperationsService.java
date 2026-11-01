package com.citylife.incidents.service;

import com.citylife.departments.model.Department;
import com.citylife.departments.repository.DepartmentRepository;
import com.citylife.incidents.dto.AssignIncidentRequest;
import com.citylife.incidents.dto.ChangePriorityRequest;
import com.citylife.incidents.dto.IncidentResponse;
import com.citylife.incidents.dto.PageResponse;
import com.citylife.incidents.dto.RejectIncidentRequest;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.shared.error.ResourceNotFoundException;
import com.citylife.users.model.Role;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
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

    public IncidentOperationsService(
            IncidentRepository incidentRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<IncidentResponse> search(
            IncidentStatus status,
            Priority priority,
            UUID categoryId,
            UUID departmentId,
            String district,
            String search,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        Page<IncidentResponse> result = incidentRepository.findAll(
                        operationFilters(status, priority, categoryId, departmentId, district, search),
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
    public IncidentResponse validate(UUID incidentId) {
        Incident incident = getIncident(incidentId);
        incident.validateIncident();
        log.info("Incident {} validated", incidentId);
        return IncidentResponse.from(incident);
    }

    @Transactional
    public IncidentResponse reject(UUID incidentId, RejectIncidentRequest request) {
        Incident incident = getIncident(incidentId);
        incident.reject(request.reason());
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
    public IncidentResponse assign(UUID incidentId, AssignIncidentRequest request) {
        Incident incident = getIncident(incidentId);
        Department department = departmentRepository.findById(request.departmentId())
                .filter(Department::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("DEPARTMENT_NOT_FOUND", "Departamento no encontrado"));
        User technician = request.technicianId() == null ? null : getTechnician(request.technicianId());
        incident.assign(department, technician);
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

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Specification<Incident> operationFilters(
            IncidentStatus status,
            Priority priority,
            UUID categoryId,
            UUID departmentId,
            String district,
            String search
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

    private String normalize(String value) {
        String normalized = blankToNull(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }
}
