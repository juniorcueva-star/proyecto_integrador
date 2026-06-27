package com.estiloia.estilo_ia.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IaAdaptacionRequest(
        @NotNull(message = "Debes seleccionar una prenda superior")
        Long prendaSuperiorId,
        @NotNull(message = "Debes seleccionar una prenda inferior")
        Long prendaInferiorId,
        @NotNull(message = "La estatura es obligatoria")
        @Min(value = 140, message = "La estatura debe estar entre 140 y 205 cm")
        @Max(value = 205, message = "La estatura debe estar entre 140 y 205 cm")
        Integer estaturaCm,
        @NotBlank(message = "La contextura es obligatoria")
        String contextura,
        @NotBlank(message = "La ocasion es obligatoria")
        String ocasion
) {
}
