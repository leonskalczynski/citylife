package com.urbanpulse.incidents.repository;

import com.urbanpulse.incidents.model.Attachment;
import com.urbanpulse.incidents.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findAllByIncidentOrderByCreatedAtAsc(Incident incident);

    long countByIncident(Incident incident);
}
