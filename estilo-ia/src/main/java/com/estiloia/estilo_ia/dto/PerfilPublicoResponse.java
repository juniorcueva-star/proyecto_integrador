package com.estiloia.estilo_ia.dto;

import java.util.List;

public record PerfilPublicoResponse(
        Long usuarioId,
        String nombre,
        String telefono,
        Double promedioCalificacion,
        Long cantidadResenas,
        List<ResenaResponse> resenasRecibidas,
        List<PrendaResumenResponse> prendasPublicadas,
        List<MetodoPagoResponse> metodosPago
) {
}