package com.estiloia.estilo_ia.enums;

/**
 * Estados posibles de una cuenta de usuario.
 * ACTIVO: puede usar la plataforma.
 * BANEADO: no puede iniciar sesion.
 * ELIMINADO: borrado logico, no se elimina fisicamente de la BD.
 */
public enum EstadoUsuario {
    ACTIVO,
    BANEADO,
    ELIMINADO
}
