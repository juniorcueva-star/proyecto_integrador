package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.Reclamo;

import java.time.LocalDateTime;

public record ReclamoResponse(
        Long id,
        Long usuarioCreadorId,
        String nombreUsuarioCreador,
        Long usuarioReportadoId,
        String nombreUsuarioReportado,
        Long prendaId,
        String nombrePrenda,
        String motivo,
        String estado,
        String descripcion,
        String respuestaAdmin,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {

    public static ReclamoResponse desdeEntidad(Reclamo reclamo) {
        return new ReclamoResponse(
                reclamo.getId(),
                reclamo.getUsuarioCreador().getId(),
                reclamo.getUsuarioCreador().getNombre(),
                reclamo.getUsuarioReportado() != null ? reclamo.getUsuarioReportado().getId() : null,
                reclamo.getUsuarioReportado() != null ? reclamo.getUsuarioReportado().getNombre() : "No especificado",
                reclamo.getPrenda() != null ? reclamo.getPrenda().getId() : null,
                reclamo.getPrenda() != null ? reclamo.getPrenda().getNombre() : "No especificada",
                reclamo.getMotivo().name(),
                reclamo.getEstado().name(),
                reclamo.getDescripcion(),
                reclamo.getRespuestaAdmin(),
                reclamo.getFechaCreacion(),
                reclamo.getFechaActualizacion()
        );
    }
}