package com.urbanpulse.incidents.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateIncidentRequest(
        @NotBlank(message = "El título es obligatorio")
        @Size(min = 5, max = 120, message = "El título debe tener entre 5 y 120 caracteres")
        String title,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(min = 10, max = 2000, message = "La descripción debe tener entre 10 y 2000 caracteres")
        String description,

        @NotNull(message = "Selecciona una categoría")
        UUID categoryId,

        @DecimalMin(value = "-90", message = "La latitud mínima es -90")
        @DecimalMax(value = "90", message = "La latitud máxima es 90")
        Double latitude,

        @DecimalMin(value = "-180", message = "La longitud mínima es -180")
        @DecimalMax(value = "180", message = "La longitud máxima es 180")
        Double longitude,

        @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
        String address,

        @Size(max = 100, message = "El distrito no puede superar 100 caracteres")
        String district
) {
}
