package com.estiloia.estilo_ia.dto;

/**
 * DTO que se devuelve al registrar o iniciar sesion.
 * Incluye el token JWT y datos basicos del usuario.
 */
public record AuthResponse(
        String token,
        String tipoToken,
        Long usuarioId,
        String nombre,
        String email,
        String rol
) {
}
