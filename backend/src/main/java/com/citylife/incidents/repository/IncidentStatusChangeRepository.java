package com.citylife.incidents.repository;

import com.citylife.incidents.model.Incident;
import com.citylife.incidents.model.IncidentStatusChange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IncidentStatusChangeRepository extends JpaRepository<IncidentStatusChange, UUID> {

    List<IncidentStatusChange> findAllByIncidentOrderByChangedAtAsc(Incident incident);
}
