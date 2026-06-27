package com.estiloia.estilo_ia.dto;

import java.math.BigDecimal;
import java.util.List;

public record IaPrendaSugeridaResponse(
        String nombre,
        String descripcion,
        String marca,
        String color,
        String talla,
        String categoria,
        String estadoFisico,
        BigDecimal precio,
        String tipoPublicacion,
        List<String> observaciones
) {
}
