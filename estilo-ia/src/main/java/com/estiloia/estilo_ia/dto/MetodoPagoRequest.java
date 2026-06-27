package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.enums.TipoMetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MetodoPagoRequest(

        @NotNull(message = "El tipo de metodo de pago es obligatorio")
        TipoMetodoPago tipoMetodoPago,

        @Size(max = 30, message = "El numero no debe superar los 30 caracteres")
        String numero,

        @Size(max = 120, message = "El titular no debe superar los 120 caracteres")
        String titular,

        @Size(max = 500, message = "La imagen QR no debe superar los 500 caracteres")
        String imagenQrUrl,

        String instrucciones
) {
}