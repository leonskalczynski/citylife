package com.citylife.incidents.repository;

import com.citylife.incidents.model.Incident;
import com.citylife.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    List<Incident> findAllByCreatedByOrderByCreatedAtDesc(User createdBy);

    Optional<Incident> findByIdAndCreatedBy(UUID id, User createdBy);

    long countByCreatedBy(User createdBy);
}
