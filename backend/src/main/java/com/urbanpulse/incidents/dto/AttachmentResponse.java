package com.urbanpulse.incidents.dto;

import com.urbanpulse.incidents.model.Attachment;

import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String originalFileName,
        String contentType,
        long sizeBytes,
        HistoryActorResponse uploadedBy,
        Instant createdAt
) {
    public static AttachmentResponse from(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                HistoryActorResponse.from(attachment.getUploadedBy()),
                attachment.getCreatedAt()
        );
    }
}
