package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.Prenda;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para devolver informacion de una prenda al cliente.
 */
public record PrendaResponse(
        Long id,
        String nombre,
        String descripcion,
        String marca,
        String genero,
        String color,
        String talla,
        String categoria,
        String estadoFisico,
        BigDecimal precio,
        String tipoPublicacion,
        String estadoPublicacion,
        Boolean disponible,
        String contacto,
        String imagenUrl,
        Long usuarioId,
        String nombreVendedor,
        String emailVendedor,
        LocalDateTime fechaPublicacion
) {

    /**
     * Convierte una entidad Prenda en un DTO PrendaResponse.
     */
    public static PrendaResponse desdeEntidad(Prenda prenda) {
        return new PrendaResponse(
                prenda.getId(),
                prenda.getNombre(),
                prenda.getDescripcion(),
                prenda.getMarca(),
                prenda.getGenero() == null ? "UNISEX" : prenda.getGenero().name(),
                prenda.getColor(),
                prenda.getTalla().name(),
                prenda.getCategoria().name(),
                prenda.getEstadoFisico().name(),
                prenda.getPrecio(),
                prenda.getTipoPublicacion().name(),
                prenda.getEstadoPublicacion().name(),
                prenda.getEstadoPublicacion() == com.estiloia.estilo_ia.enums.EstadoPublicacion.PUBLICADA,
                prenda.getContacto(),
                prenda.getImagenUrl(),
                prenda.getUsuario().getId(),
                prenda.getUsuario().getNombre(),
                prenda.getUsuario().getEmail(),
                prenda.getFechaPublicacion()
        );
    }
}
