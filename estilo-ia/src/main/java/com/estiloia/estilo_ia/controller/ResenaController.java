package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.ResenaRequest;
import com.estiloia.estilo_ia.dto.ResenaResponse;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.service.ResenaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaService resenaService;

    @PostMapping
    public ResponseEntity<ResenaResponse> crearResena(
            @Valid @RequestBody ResenaRequest request,
            @AuthenticationPrincipal Usuario autor
    ) {
        return ResponseEntity.ok(resenaService.crearResena(request, autor));
    }

    @GetMapping("/recibidas")
    public ResponseEntity<List<ResenaResponse>> listarMisResenasRecibidas(
            @AuthenticationPrincipal Usuario receptor
    ) {
        return ResponseEntity.ok(resenaService.listarResenasRecibidas(receptor));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<ResenaResponse>> listarResenasDeUsuario(
            @PathVariable Long usuarioId
    ) {
        return ResponseEntity.ok(resenaService.listarResenasDeUsuario(usuarioId));
    }
}