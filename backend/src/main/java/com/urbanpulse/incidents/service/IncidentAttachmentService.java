package com.urbanpulse.incidents.service;

import com.urbanpulse.incidents.dto.AttachmentResponse;
import com.urbanpulse.incidents.model.Attachment;
import com.urbanpulse.incidents.model.Incident;
import com.urbanpulse.incidents.repository.AttachmentRepository;
import com.urbanpulse.incidents.repository.IncidentRepository;
import com.urbanpulse.shared.error.InvalidRequestException;
import com.urbanpulse.shared.error.ResourceNotFoundException;
import com.urbanpulse.users.model.Role;
import com.urbanpulse.users.model.User;
import com.urbanpulse.users.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class IncidentAttachmentService {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_ATTACHMENTS_PER_INCIDENT = 10;

    private final AttachmentRepository attachmentRepository;
    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final AttachmentStorageService storageService;

    public IncidentAttachmentService(
            AttachmentRepository attachmentRepository,
            IncidentRepository incidentRepository,
            UserRepository userRepository,
            AttachmentStorageService storageService
    ) {
        this.attachmentRepository = attachmentRepository;
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    @Transactional
    public AttachmentResponse uploadForCitizen(UUID incidentId, String email, MultipartFile file) {
        User citizen = getUser(email);
        Incident incident = incidentRepository.findByIdAndCreatedBy(incidentId, citizen)
                .orElseThrow(() -> notFound("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
        return upload(incident, citizen, file);
    }

    @Transactional
    public AttachmentResponse uploadForTechnician(UUID incidentId, String email, MultipartFile file) {
        User technician = getUser(email);
        Incident incident = incidentRepository.findByIdAndAssignedTo(incidentId, technician)
                .orElseThrow(() -> notFound("WORK_NOT_FOUND", "Trabajo asignado no encontrado"));
        return upload(incident, technician, file);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listForCitizen(UUID incidentId, String email) {
        User citizen = getUser(email);
        Incident incident = incidentRepository.findByIdAndCreatedBy(incidentId, citizen)
                .orElseThrow(() -> notFound("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
        return list(incident);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listForTechnician(UUID incidentId, String email) {
        User technician = getUser(email);
        Incident incident = incidentRepository.findByIdAndAssignedTo(incidentId, technician)
                .orElseThrow(() -> notFound("WORK_NOT_FOUND", "Trabajo asignado no encontrado"));
        return list(incident);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listForOperator(UUID incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> notFound("INCIDENT_NOT_FOUND", "Incidencia no encontrada"));
        return list(incident);
    }

    @Transactional(readOnly = true)
    public AttachmentContent getContent(UUID attachmentId, String email) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> notFound("ATTACHMENT_NOT_FOUND", "Archivo no encontrado"));
        User user = getUser(email);
        authorizeRead(attachment.getIncident(), user);
        return new AttachmentContent(
                storageService.load(attachment.getStoredFileName()),
                attachment.getContentType(),
                attachment.getOriginalFileName(),
                attachment.getSizeBytes()
        );
    }

    private AttachmentResponse upload(Incident incident, User uploader, MultipartFile file) {
        if (attachmentRepository.countByIncident(incident) >= MAX_ATTACHMENTS_PER_INCIDENT) {
            throw invalid("ATTACHMENT_LIMIT_REACHED", "La incidencia ya tiene el máximo de 10 archivos");
        }

        byte[] content = readAndValidateSize(file);
        String contentType = detectContentType(content);
        String originalFileName = safeFileName(file.getOriginalFilename(), contentType);
        UUID attachmentId = UUID.randomUUID();
        String storedFileName = storageService.store(attachmentId, content, contentType);

        try {
            Attachment attachment = attachmentRepository.saveAndFlush(new Attachment(
                    attachmentId,
                    incident,
                    uploader,
                    originalFileName,
                    storedFileName,
                    contentType,
                    content.length
            ));
            return AttachmentResponse.from(attachment);
        } catch (RuntimeException exception) {
            storageService.deleteQuietly(storedFileName);
            throw exception;
        }
    }

    private List<AttachmentResponse> list(Incident incident) {
        return attachmentRepository.findAllByIncidentOrderByCreatedAtAsc(incident).stream()
                .map(AttachmentResponse::from)
                .toList();
    }

    private void authorizeRead(Incident incident, User user) {
        boolean allowed = switch (user.getRole()) {
            case OPERATOR -> true;
            case CITIZEN -> incident.getCreatedBy().getId().equals(user.getId());
            case TECHNICIAN -> incident.getAssignedTo() != null && incident.getAssignedTo().getId().equals(user.getId());
            default -> false;
        };
        if (!allowed) throw new AccessDeniedException("No tienes acceso a este archivo");
    }

    private byte[] readAndValidateSize(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("EMPTY_ATTACHMENT", "Selecciona un archivo que no esté vacío");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw invalid("ATTACHMENT_TOO_LARGE", "El archivo no puede superar los 5 MB");
        }
        try {
            byte[] content = file.getBytes();
            if (content.length > MAX_SIZE_BYTES) {
                throw invalid("ATTACHMENT_TOO_LARGE", "El archivo no puede superar los 5 MB");
            }
            return content;
        } catch (IOException exception) {
            throw invalid("ATTACHMENT_READ_FAILED", "No se ha podido leer el archivo");
        }
    }

    private String detectContentType(byte[] content) {
        if (content.length >= 3 && (content[0] & 0xff) == 0xff && (content[1] & 0xff) == 0xd8 && (content[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (content.length >= 8
                && (content[0] & 0xff) == 0x89 && content[1] == 0x50 && content[2] == 0x4e && content[3] == 0x47
                && content[4] == 0x0d && content[5] == 0x0a && content[6] == 0x1a && content[7] == 0x0a) {
            return "image/png";
        }
        if (content.length >= 12
                && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') {
            return "image/webp";
        }
        throw invalid("UNSUPPORTED_ATTACHMENT_TYPE", "Solo se permiten imágenes JPEG, PNG o WebP");
    }

    private String safeFileName(String originalFileName, String contentType) {
        String fallback = "imagen" + switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            default -> ".webp";
        };
        if (!StringUtils.hasText(originalFileName)) return fallback;
        String cleanedPath = StringUtils.cleanPath(originalFileName).replaceAll("[\\p{Cntrl}]", "");
        String cleaned = StringUtils.getFilename(cleanedPath);
        if (cleaned.contains("..") || !StringUtils.hasText(cleaned)) {
            throw invalid("INVALID_FILE_NAME", "El nombre del archivo no es válido");
        }
        return cleaned.length() <= 255 ? cleaned : cleaned.substring(cleaned.length() - 255);
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> notFound("USER_NOT_FOUND", "Usuario no encontrado"));
    }

    private InvalidRequestException invalid(String code, String message) {
        return new InvalidRequestException(code, message);
    }

    private ResourceNotFoundException notFound(String code, String message) {
        return new ResourceNotFoundException(code, message);
    }
}
