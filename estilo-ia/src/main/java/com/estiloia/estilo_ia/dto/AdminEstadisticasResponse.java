package com.estiloia.estilo_ia.dto;

import java.math.BigDecimal;

public record AdminEstadisticasResponse(
        Long usuariosTotales,
        Long usuariosActivos,
        Long usuariosBaneados,
        Long prendasPublicadas,
        Long prendasVendidas,
        Long prendasIntercambiadas,
        BigDecimal dineroTotalRecaudado,
        Long prendasReutilizadas,
        Double impactoAmbientalEstimadoKgCo2
) {
}