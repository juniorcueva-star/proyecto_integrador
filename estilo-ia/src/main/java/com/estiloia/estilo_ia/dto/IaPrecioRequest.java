package com.estiloia.estilo_ia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IaPrecioRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,
        @NotBlank(message = "La marca es obligatoria")
        String marca,
        @NotBlank(message = "El color es obligatorio")
        String color,
        @NotBlank(message = "La categoria es obligatoria")
        String categoria,
        @NotBlank(message = "El estado fisico es obligatorio")
        String estadoFisico,
        @NotBlank(message = "El tipo de publicacion es obligatorio")
        String tipoPublicacion,
        @NotBlank(message = "La talla es obligatoria")
        String talla,
        @NotNull(message = "La cantidad de referencias es obligatoria")
        Integer limiteReferencias
) {
}
