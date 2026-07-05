package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.enums.CategoriaPrenda;
import com.estiloia.estilo_ia.enums.EstadoFisicoPrenda;
import com.estiloia.estilo_ia.enums.GeneroPrenda;
import com.estiloia.estilo_ia.enums.TallaPrenda;
import com.estiloia.estilo_ia.enums.TipoPublicacion;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * DTO para crear o editar una prenda.
 */
public record PrendaRequest(

        @NotBlank(message = "El nombre de la prenda es obligatorio")
        @Size(max = 120, message = "El nombre no debe superar los 120 caracteres")
        @Pattern(
                regexp = "^[\\p{L}]+(?:\\s+[\\p{L}]+)*$",
                message = "El nombre de la prenda solo puede contener letras y espacios"
        )
        String nombre,

        @NotBlank(message = "La descripcion es obligatoria")
        String descripcion,

        @NotBlank(message = "La marca es obligatoria")
        @Size(max = 100, message = "La marca no debe superar los 100 caracteres")
        String marca,

        @Size(max = 100, message = "La marca personalizada no debe superar los 100 caracteres")
        String marcaPersonalizada,

        GeneroPrenda genero,

        @NotBlank(message = "El color es obligatorio")
        @Size(max = 60, message = "El color no debe superar los 60 caracteres")
        String color,

        @NotNull(message = "La talla es obligatoria")
        TallaPrenda talla,

        @NotNull(message = "La categoria es obligatoria")
        CategoriaPrenda categoria,

        @NotNull(message = "El estado fisico es obligatorio")
        EstadoFisicoPrenda estadoFisico,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        BigDecimal precio,

        @NotNull(message = "El tipo de publicacion es obligatorio")
        TipoPublicacion tipoPublicacion,

        @NotBlank(message = "El contacto es obligatorio")
        @Size(max = 30, message = "El contacto no debe superar los 30 caracteres")
        @Pattern(regexp = "9\\d{8}", message = "El contacto debe empezar con 9 y tener 9 digitos")
        String contacto,

        @Size(max = 500, message = "La URL de imagen no debe superar los 500 caracteres")
        String imagenUrl
) {
}
