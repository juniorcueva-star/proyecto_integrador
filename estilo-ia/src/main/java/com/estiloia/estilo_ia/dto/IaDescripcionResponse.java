package com.estiloia.estilo_ia.dto;

import java.util.List;

public record IaDescripcionResponse(
        String tituloSugerido,
        String descripcion,
        List<String> etiquetas
) {
}
