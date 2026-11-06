package com.urbanpulse.incidents.dto;

import com.urbanpulse.incidents.model.Priority;
import jakarta.validation.constraints.NotNull;

public record ChangePriorityRequest(
        @NotNull(message = "Selecciona una prioridad") Priority priority
) {
}
