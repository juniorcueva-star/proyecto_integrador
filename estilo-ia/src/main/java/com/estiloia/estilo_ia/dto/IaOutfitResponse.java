package com.estiloia.estilo_ia.dto;

import java.util.List;

public record IaOutfitResponse(
        String recomendacionGeneral,
        List<String> prendasSugeridas,
        List<String> razones,
        List<PrendaResumenResponse> referenciasCatalogo
) {
}
