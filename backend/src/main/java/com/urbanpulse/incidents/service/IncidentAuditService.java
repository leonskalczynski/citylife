package com.urbanpulse.incidents.service;

import com.urbanpulse.incidents.dto.IncidentStatusChangeResponse;
import com.urbanpulse.incidents.model.Incident;
import com.urbanpulse.incidents.model.IncidentStatus;
import com.urbanpulse.incidents.model.IncidentStatusChange;
import com.urbanpulse.incidents.repository.IncidentRepository;
import com.urbanpulse.incidents.repository.IncidentStatusChangeRepository;
import com.urbanpulse.shared.error.ResourceNotFoundException;
import com.urbanpulse.users.model.User;
import com.urbanpulse.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class IncidentAuditService {

    private final IncidentStatusChangeRepository statusChangeRepository;
    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public IncidentAuditService(
            IncidentStatusChangeRepository statusChangeRepository,
            IncidentRepository incidentRepository,
            UserRepository userRepository
    ) {
        this.statusChangeRepository = statusChangeRepository;
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
    }

    public void record(Incident incident, IncidentStatus previousStatus, User actor, String reason) {
        if (previousStatus == incident.getStatus()) return;
        statusChangeRepository.save(new IncidentStatusChange(
                incident,
                previousStatus,
                incident.getStatus(),
                actor,
                reason
        ));
    }

    @Transactional(readOnly = true)
    public List<IncidentStatusChangeResponse> listForCitizen(UUID incidentId, String email) {
        User citizen = getUser(email);
        Incident incident = incidentRepository.findByIdAndCreatedBy(incidentId, citizen)
                .orElseThrow(() -> notFound("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
        return toResponses(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentStatusChangeResponse> listForOperator(UUID incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> notFound("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
        return toResponses(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentStatusChangeResponse> listForTechnician(UUID incidentId, String email) {
        User technician = getUser(email);
        Incident incident = incidentRepository.findByIdAndAssignedTo(incidentId, technician)
                .orElseThrow(() -> notFound("WORK_NOT_FOUND", "Trabajo asignado no encontrado"));
        return toResponses(incident);
    }

    private List<IncidentStatusChangeResponse> toResponses(Incident incident) {
        return statusChangeRepository.findAllByIncidentOrderByChangedAtAsc(incident).stream()
                .map(IncidentStatusChangeResponse::from)
                .toList();
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> notFound("USER_NOT_FOUND", "Usuario no encontrado"));
    }

    private ResourceNotFoundException notFound(String code, String message) {
        return new ResourceNotFoundException(code, message);
    }
}
