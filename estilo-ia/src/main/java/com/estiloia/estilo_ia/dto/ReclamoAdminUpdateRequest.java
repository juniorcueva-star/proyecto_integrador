package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.enums.EstadoReclamo;
import jakarta.validation.constraints.NotNull;

public record ReclamoAdminUpdateRequest(

        @NotNull(message = "El estado es obligatorio")
        EstadoReclamo estado,

        String respuestaAdmin
) {
}