package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.PerfilPropioResponse;
import com.estiloia.estilo_ia.dto.PerfilPublicoResponse;
import com.estiloia.estilo_ia.dto.UsuarioResponse;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.service.UsuarioPerfilService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioPerfilService usuarioPerfilService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> obtenerUsuarioActual(
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(UsuarioResponse.desdeEntidad(usuario));
    }

    @GetMapping("/mi-perfil")
    public ResponseEntity<PerfilPropioResponse> obtenerMiPerfil(
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(usuarioPerfilService.obtenerMiPerfil(usuario));
    }

    @GetMapping("/{id}/perfil-publico")
    public ResponseEntity<PerfilPublicoResponse> obtenerPerfilPublico(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(usuarioPerfilService.obtenerPerfilPublico(id, usuario));
    }
}
