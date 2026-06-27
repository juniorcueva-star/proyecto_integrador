package com.estiloia.estilo_ia.dto;

import com.estiloia.estilo_ia.entity.Usuario;

public record AdminUsuarioResumenResponse(
        Long id,
        String nombre,
        String email,
        String telefono,
        String rol,
        String estadoUsuario,
        Boolean eliminado
) {

    public static AdminUsuarioResumenResponse desdeEntidad(Usuario usuario) {
        return new AdminUsuarioResumenResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getTelefono(),
                usuario.getRol().name(),
                usuario.getEstadoUsuario().name(),
                usuario.getEliminado()
        );
    }
}