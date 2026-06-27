package com.estiloia.estilo_ia.dto;

import java.util.List;

public record AdminUsuarioDetalleResponse(
        AdminUsuarioResumenResponse usuario,
        Double promedioCalificacion,
        Long cantidadResenas,
        List<PrendaResumenResponse> prendas,
        List<ResenaResponse> resenasRecibidas
) {
}