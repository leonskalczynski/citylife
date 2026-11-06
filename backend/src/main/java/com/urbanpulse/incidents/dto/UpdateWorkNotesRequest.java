package com.urbanpulse.incidents.dto;

import jakarta.validation.constraints.Size;

public record UpdateWorkNotesRequest(
        @Size(max = 2000, message = "Las notas no pueden superar los 2000 caracteres")
        String notes
) {
}
