package com.estiloia.estilo_ia.dto;

import java.math.BigDecimal;
import java.util.List;

public record IaPrecioResponse(
        BigDecimal precioSugerido,
        BigDecimal rangoMinimo,
        BigDecimal rangoMaximo,
        String explicacion,
        List<PrendaResumenResponse> referenciasCatalogo
) {
}
