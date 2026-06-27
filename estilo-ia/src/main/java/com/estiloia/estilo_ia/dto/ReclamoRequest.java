package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.enums.MotivoReclamo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReclamoRequest(

        Long usuarioReportadoId,

        Long prendaId,

        @NotNull(message = "El motivo es obligatorio")
        MotivoReclamo motivo,

        @NotBlank(message = "La descripcion es obligatoria")
        @Size(max = 1000, message = "La descripcion no debe superar los 1000 caracteres")
        String descripcion
) {
}