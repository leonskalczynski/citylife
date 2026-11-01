package com.citylife.incidents.dto;

import com.citylife.incidents.model.Priority;
import jakarta.validation.constraints.NotNull;

public record ChangePriorityRequest(
        @NotNull(message = "Selecciona una prioridad") Priority priority
) {
}
