package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.MetodoPago;

import java.time.LocalDateTime;

public record MetodoPagoResponse(
        Long id,
        String tipoMetodoPago,
        String numero,
        String titular,
        String imagenQrUrl,
        String instrucciones,
        Boolean activo,
        LocalDateTime fechaRegistro
) {

    public static MetodoPagoResponse desdeEntidad(MetodoPago metodoPago) {
        return new MetodoPagoResponse(
                metodoPago.getId(),
                metodoPago.getTipoMetodoPago().name(),
                metodoPago.getNumero(),
                metodoPago.getTitular(),
                metodoPago.getImagenQrUrl(),
                metodoPago.getInstrucciones(),
                metodoPago.getActivo(),
                metodoPago.getFechaRegistro()
        );
    }
}