package com.citylife.incidents.repository;

import com.citylife.incidents.model.Attachment;
import com.citylife.incidents.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findAllByIncidentOrderByCreatedAtAsc(Incident incident);

    long countByIncident(Incident incident);
}
