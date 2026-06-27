package com.estiloia.estilo_ia.dto;

import jakarta.validation.constraints.NotBlank;

public record IaOutfitRequest(
        @NotBlank(message = "El estilo es obligatorio")
        String estilo,
        @NotBlank(message = "La ocasion es obligatoria")
        String ocasion,
        @NotBlank(message = "El clima es obligatorio")
        String clima
) {
}
