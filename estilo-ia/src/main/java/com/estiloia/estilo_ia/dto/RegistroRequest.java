package com.estiloia.estilo_ia.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistroRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 3, max = 60, message = "El nombre debe tener entre 3 y 60 caracteres")
        @Pattern(
                regexp = "^[\\p{L}]+(?:\\s+[\\p{L}]+)*$",
                message = "El nombre solo puede contener letras y espacios"
        )
        String nombre,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El correo debe tener un formato valido y contener @")
        String email,

        @NotBlank(message = "La contrasena es obligatoria")
        @Size(min = 6, message = "La contrasena debe tener minimo 6 caracteres")
        String password,

        @NotBlank(message = "El celular es obligatorio")
        @Pattern(regexp = "9\\d{8}", message = "El celular debe empezar con 9 y tener 9 digitos")
        String telefono
) {
}
