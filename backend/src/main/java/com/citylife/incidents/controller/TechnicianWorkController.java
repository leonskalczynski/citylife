package com.citylife.incidents.controller;

import com.citylife.incidents.dto.IncidentResponse;
import com.citylife.incidents.dto.AttachmentResponse;
import com.citylife.incidents.dto.IncidentStatusChangeResponse;
import com.citylife.incidents.dto.ResolveIncidentRequest;
import com.citylife.incidents.dto.UpdateWorkNotesRequest;
import com.citylife.incidents.service.TechnicianWorkService;
import com.citylife.incidents.service.IncidentAuditService;
import com.citylife.incidents.service.IncidentAttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/work/incidents")
@PreAuthorize("hasRole('TECHNICIAN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Technician work")
public class TechnicianWorkController {

    private final TechnicianWorkService workService;
    private final IncidentAuditService auditService;
    private final IncidentAttachmentService attachmentService;

    public TechnicianWorkController(TechnicianWorkService workService, IncidentAuditService auditService, IncidentAttachmentService attachmentService) {
        this.workService = workService;
        this.auditService = auditService;
        this.attachmentService = attachmentService;
    }

    @GetMapping
    @Operation(summary = "Lists incidents assigned to the authenticated technician")
    public List<IncidentResponse> list(Authentication authentication) {
        return workService.getAssignedWork(authentication.getName());
    }

    @GetMapping("/{incidentId}")
    @Operation(summary = "Returns an incident assigned to the authenticated technician")
    public IncidentResponse get(@PathVariable UUID incidentId, Authentication authentication) {
        return workService.get(incidentId, authentication.getName());
    }

    @GetMapping("/{incidentId}/history")
    @Operation(summary = "Returns status history for an assigned incident")
    public List<IncidentStatusChangeResponse> getHistory(@PathVariable UUID incidentId, Authentication authentication) {
        return auditService.listForTechnician(incidentId, authentication.getName());
    }

    @GetMapping("/{incidentId}/attachments")
    @Operation(summary = "Lists image attachments for an assigned incident")
    public List<AttachmentResponse> getAttachments(@PathVariable UUID incidentId, Authentication authentication) {
        return attachmentService.listForTechnician(incidentId, authentication.getName());
    }

    @PostMapping(value = "/{incidentId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Adds work evidence to an assigned incident")
    public AttachmentResponse uploadAttachment(
            @PathVariable UUID incidentId,
            Authentication authentication,
            @RequestPart("file") MultipartFile file
    ) {
        return attachmentService.uploadForTechnician(incidentId, authentication.getName(), file);
    }

    @PostMapping("/{incidentId}/start")
    @Operation(summary = "Starts work on an assigned incident")
    public IncidentResponse start(@PathVariable UUID incidentId, Authentication authentication) {
        return workService.start(incidentId, authentication.getName());
    }

    @PutMapping("/{incidentId}/notes")
    @Operation(summary = "Updates technician work notes")
    public IncidentResponse updateNotes(
            @PathVariable UUID incidentId,
            Authentication authentication,
            @Valid @RequestBody UpdateWorkNotesRequest request
    ) {
        return workService.updateNotes(incidentId, authentication.getName(), request);
    }

    @PostMapping("/{incidentId}/resolve")
    @Operation(summary = "Resolves an incident with a summary")
    public IncidentResponse resolve(
            @PathVariable UUID incidentId,
            Authentication authentication,
            @Valid @RequestBody ResolveIncidentRequest request
    ) {
        return workService.resolve(incidentId, authentication.getName(), request);
    }
}
