package com.estiloia.estilo_ia.dto;

import java.util.List;

public record PrendaOpcionesResponse(
        List<String> generos,
        List<String> marcasReconocidas,
        String opcionOtraMarca
) {
}
