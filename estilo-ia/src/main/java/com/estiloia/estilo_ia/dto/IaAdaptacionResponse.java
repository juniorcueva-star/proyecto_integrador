package com.estiloia.estilo_ia.dto;

public record IaAdaptacionResponse(
        String modoRespuesta,
        String resumenPerfil,
        String evaluacionGeneral,
        String recomendacionSuperior,
        String recomendacionInferior,
        String equilibrioVisual,
        String tallaSuperiorSugerida,
        String tallaInferiorSugerida,
        String notaAjuste,
        PrendaResumenResponse prendaSuperior,
        PrendaResumenResponse prendaInferior
) {
}
