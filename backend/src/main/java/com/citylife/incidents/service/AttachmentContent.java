package com.citylife.incidents.service;

import org.springframework.core.io.Resource;

public record AttachmentContent(
        Resource resource,
        String contentType,
        String originalFileName,
        long sizeBytes
) {
}
