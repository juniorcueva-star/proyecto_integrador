package com.estiloia.estilo_ia.dto;

import jakarta.validation.constraints.NotBlank;

public record IaDescripcionRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,
        @NotBlank(message = "La marca es obligatoria")
        String marca,
        @NotBlank(message = "El color es obligatorio")
        String color,
        @NotBlank(message = "La talla es obligatoria")
        String talla,
        @NotBlank(message = "La categoria es obligatoria")
        String categoria,
        @NotBlank(message = "El estado fisico es obligatorio")
        String estadoFisico,
        @NotBlank(message = "El tipo de publicacion es obligatorio")
        String tipoPublicacion
) {
}
