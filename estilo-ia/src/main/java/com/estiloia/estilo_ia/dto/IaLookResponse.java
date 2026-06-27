package com.estiloia.estilo_ia.dto;

import java.util.List;

public record IaLookResponse(
        String modoRespuesta,
        String resumenPerfilUsuario,
        String perfilVisual,
        String recomendacionGeneral,
        String notaPruebaVisual,
        List<String> prendasSugeridas,
        List<String> razones,
        List<String> pasosSugeridos,
        List<PrendaResumenResponse> referenciasCatalogo
) {
}
