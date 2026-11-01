package com.citylife.incidents.controller;

import com.citylife.incidents.service.AttachmentContent;
import com.citylife.incidents.service.IncidentAttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/attachments")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Incident attachments")
public class AttachmentController {

    private final IncidentAttachmentService attachmentService;

    public AttachmentController(IncidentAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/{attachmentId}/content")
    @Operation(summary = "Downloads attachment content when the user can access its incident")
    public ResponseEntity<org.springframework.core.io.Resource> getContent(
            @PathVariable UUID attachmentId,
            Authentication authentication
    ) {
        AttachmentContent content = attachmentService.getContent(attachmentId, authentication.getName());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(content.contentType()))
                .contentLength(content.sizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(content.originalFileName(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(content.resource());
    }
}
