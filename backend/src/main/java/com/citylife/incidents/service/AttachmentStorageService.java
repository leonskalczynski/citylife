package com.citylife.incidents.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

@Service
public class AttachmentStorageService {

    private final Path storageDirectory;

    public AttachmentStorageService(@Value("${app.attachments.storage-path}") String storagePath) {
        this.storageDirectory = Path.of(storagePath).toAbsolutePath().normalize();
    }

    public String store(UUID attachmentId, byte[] content, String contentType) {
        String storedFileName = attachmentId + extensionFor(contentType);
        try {
            Files.createDirectories(storageDirectory);
            Files.write(
                    resolve(storedFileName),
                    content,
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE
            );
            return storedFileName;
        } catch (IOException exception) {
            throw new IllegalStateException("No se ha podido guardar el archivo", exception);
        }
    }

    public Resource load(String storedFileName) {
        Path path = resolve(storedFileName);
        if (!Files.isRegularFile(path)) {
            throw new IllegalStateException("El archivo almacenado no está disponible");
        }
        return new FileSystemResource(path);
    }

    public void deleteQuietly(String storedFileName) {
        try {
            Files.deleteIfExists(resolve(storedFileName));
        } catch (IOException ignored) {
            // Best effort cleanup after a failed database write.
        }
    }

    private Path resolve(String storedFileName) {
        Path resolved = storageDirectory.resolve(storedFileName).normalize();
        if (!resolved.startsWith(storageDirectory)) {
            throw new IllegalArgumentException("Ruta de archivo no válida");
        }
        return resolved;
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new IllegalArgumentException("Tipo de archivo no compatible");
        };
    }
}
