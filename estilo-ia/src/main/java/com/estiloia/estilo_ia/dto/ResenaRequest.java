package com.estiloia.estilo_ia.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResenaRequest(

        @NotNull(message = "El usuario receptor es obligatorio")
        Long receptorId,

        @NotNull(message = "La calificacion es obligatoria")
        @Min(value = 1, message = "La calificacion minima es 1")
        @Max(value = 5, message = "La calificacion maxima es 5")
        Integer calificacion,

        @NotBlank(message = "El comentario es obligatorio")
        @Size(max = 500, message = "El comentario no debe superar los 500 caracteres")
        String comentario
) {
}