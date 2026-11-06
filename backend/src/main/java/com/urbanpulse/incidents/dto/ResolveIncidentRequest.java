package com.urbanpulse.incidents.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveIncidentRequest(
        @NotBlank(message = "La resolución es obligatoria")
        @Size(max = 2000, message = "La resolución no puede superar los 2000 caracteres")
        String summary
) {
}
