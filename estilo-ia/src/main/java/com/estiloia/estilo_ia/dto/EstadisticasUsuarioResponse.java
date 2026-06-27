package com.estiloia.estilo_ia.dto;

import java.math.BigDecimal;

public record EstadisticasUsuarioResponse(
        Long totalPrendas,
        Long prendasPublicadas,
        Long prendasVendidas,
        Long prendasIntercambiadas,
        BigDecimal dineroRecaudado,
        Long intercambiosRealizados
) {
}