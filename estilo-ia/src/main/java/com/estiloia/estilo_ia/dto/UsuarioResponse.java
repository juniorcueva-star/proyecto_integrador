package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.Usuario;

/**
 * DTO para mostrar datos seguros del usuario.
 * No exponemos password.
 */
public record UsuarioResponse(
        Long id,
        String nombre,
        String email,
        String telefono,
        String rol,
        String estadoUsuario
) {

    public static UsuarioResponse desdeEntidad(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getRol().name(),
                usuario.getEstadoUsuario().name()
        );
    }
}
