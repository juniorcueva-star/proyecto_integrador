package com.estiloia.estilo_ia.dto;

import java.util.List;

public record PerfilPropioResponse(
        UsuarioResponse usuario,
        Double promedioCalificacion,
        Long cantidadResenas,
        List<ResenaResponse> resenasRecibidas,
        List<PrendaResumenResponse> prendasSubidas,
        List<PrendaResumenResponse> historialMovimientos,
        EstadisticasUsuarioResponse estadisticas
) {
}
