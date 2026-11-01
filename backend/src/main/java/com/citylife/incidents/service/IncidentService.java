package com.citylife.incidents.service;

import com.citylife.categories.model.Category;
import com.citylife.categories.repository.CategoryRepository;
import com.citylife.incidents.dto.CreateIncidentRequest;
import com.citylife.incidents.dto.IncidentResponse;
import com.citylife.incidents.model.Incident;
import com.citylife.incidents.repository.IncidentRepository;
import com.citylife.shared.error.InvalidRequestException;
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
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public IncidentService(
            IncidentRepository incidentRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public IncidentResponse create(String email, CreateIncidentRequest request) {
        validateLocation(request.latitude(), request.longitude());
        User citizen = getUser(email);
        Category category = categoryRepository.findById(request.categoryId())
                .filter(Category::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Categoría no encontrada"));

        Incident incident = new Incident(
                request.title(),
                request.description(),
                category,
                request.latitude(),
                request.longitude(),
                request.address(),
                request.district(),
                citizen
        );
        Incident saved = incidentRepository.save(incident);
        log.info("Incident {} reported by user {}", saved.getId(), citizen.getId());
        return IncidentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> listMine(String email) {
        User citizen = getUser(email);
        return incidentRepository.findAllByCreatedByOrderByCreatedAtDesc(citizen).stream()
                .map(IncidentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidentResponse getMine(String email, UUID incidentId) {
        User citizen = getUser(email);
        return incidentRepository.findByIdAndCreatedBy(incidentId, citizen)
                .map(IncidentResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Usuario no encontrado"));
    }

    private void validateLocation(Double latitude, Double longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new InvalidRequestException(
                    "INVALID_LOCATION",
                    "La latitud y la longitud deben indicarse juntas"
            );
        }
    }
}
