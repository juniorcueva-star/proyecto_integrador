package com.estiloia.estilo_ia.dto;

import java.util.List;

public record IaPruebaVirtualResponse(
        String estado,
        String mensaje,
        String imagenUrl,
        String resumenPerfil,
        List<PrendaResumenResponse> prendasSeleccionadas,
        List<String> recomendaciones
) {
}
