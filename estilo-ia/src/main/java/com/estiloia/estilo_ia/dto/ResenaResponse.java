package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.Resena;

import java.time.LocalDateTime;

public record ResenaResponse(
        Long id,
        Long autorId,
        String nombreAutor,
        Long receptorId,
        String nombreReceptor,
        Integer calificacion,
        String comentario,
        LocalDateTime fecha
) {

    public static ResenaResponse desdeEntidad(Resena resena) {
        return new ResenaResponse(
                resena.getId(),
                resena.getAutor().getId(),
                resena.getAutor().getNombre(),
                resena.getReceptor().getId(),
                resena.getReceptor().getNombre(),
                resena.getCalificacion(),
                resena.getComentario(),
                resena.getFecha()
        );
    }
}