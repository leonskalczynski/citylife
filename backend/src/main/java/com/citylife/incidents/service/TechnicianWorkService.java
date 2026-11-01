package com.citylife.incidents.service;

import com.citylife.incidents.dto.IncidentResponse;
import com.citylife.incidents.dto.ResolveIncidentRequest;
import com.citylife.incidents.dto.UpdateWorkNotesRequest;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.shared.error.ResourceNotFoundException;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TechnicianWorkService {

    private static final Logger log = LoggerFactory.getLogger(TechnicianWorkService.class);

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final IncidentAuditService auditService;

    public TechnicianWorkService(
            IncidentRepository incidentRepository,
            UserRepository userRepository,
            IncidentAuditService auditService
    ) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getAssignedWork(String technicianEmail) {
        User technician = getTechnician(technicianEmail);
        return incidentRepository.findAllByAssignedToOrderByUpdatedAtDesc(technician).stream()
                .map(IncidentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidentResponse get(UUID incidentId, String technicianEmail) {
        return IncidentResponse.from(getAssignedIncident(incidentId, getTechnician(technicianEmail)));
    }

    @Transactional
    public IncidentResponse start(UUID incidentId, String technicianEmail) {
        User technician = getTechnician(technicianEmail);
        Incident incident = getAssignedIncident(incidentId, technician);
        var previousStatus = incident.getStatus();
        incident.startWork();
        auditService.record(incident, previousStatus, technician, null);
        log.info("Technician started work on incident {}", incidentId);
        return IncidentResponse.from(incident);
    }

    @Transactional
    public IncidentResponse updateNotes(UUID incidentId, String technicianEmail, UpdateWorkNotesRequest request) {
        Incident incident = getAssignedIncident(incidentId, getTechnician(technicianEmail));
        incident.updateTechnicianNotes(request.notes());
        log.info("Technician updated work notes for incident {}", incidentId);
        return IncidentResponse.from(incident);
    }

    @Transactional
    public IncidentResponse resolve(UUID incidentId, String technicianEmail, ResolveIncidentRequest request) {
        User technician = getTechnician(technicianEmail);
        Incident incident = getAssignedIncident(incidentId, technician);
        var previousStatus = incident.getStatus();
        incident.resolve(request.summary());
        auditService.record(incident, previousStatus, technician, null);
        log.info("Technician resolved incident {}", incidentId);
        return IncidentResponse.from(incident);
    }

    private User getTechnician(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("TECHNICIAN_NOT_FOUND", "Técnico no encontrado"));
    }

    private Incident getAssignedIncident(UUID incidentId, User technician) {
        return incidentRepository.findByIdAndAssignedTo(incidentId, technician)
                .orElseThrow(() -> new ResourceNotFoundException("WORK_NOT_FOUND", "Trabajo asignado no encontrado"));
    }
}
