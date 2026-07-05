package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.Prenda;

import java.math.BigDecimal;

/**
 * DTO resumido para mostrar prendas en tarjetas del catalogo.
 */
public record PrendaResumenResponse(
        Long id,
        String nombre,
        String marca,
        String genero,
        BigDecimal precio,
        String categoria,
        String talla,
        String imagenUrl,
        String estadoPublicacion,
        Boolean disponible,
        Long usuarioId,
        String nombreVendedor
) {

    public static PrendaResumenResponse desdeEntidad(Prenda prenda) {
        return new PrendaResumenResponse(
                prenda.getId(),
                prenda.getNombre(),
                prenda.getMarca(),
                prenda.getGenero() == null ? "UNISEX" : prenda.getGenero().name(),
                prenda.getPrecio(),
                prenda.getCategoria().name(),
                prenda.getTalla().name(),
                prenda.getImagenUrl(),
                prenda.getEstadoPublicacion().name(),
                prenda.getEstadoPublicacion() == com.estiloia.estilo_ia.enums.EstadoPublicacion.PUBLICADA,
                prenda.getUsuario().getId(),
                prenda.getUsuario().getNombre()
        );
    }
}
