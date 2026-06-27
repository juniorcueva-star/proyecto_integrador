package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.ReclamoRequest;
import com.estiloia.estilo_ia.dto.ReclamoResponse;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.service.ReclamoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reclamos")
@RequiredArgsConstructor
public class ReclamoController {

    private final ReclamoService reclamoService;

    @PostMapping
    public ResponseEntity<ReclamoResponse> crearReclamo(
            @Valid @RequestBody ReclamoRequest request,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(reclamoService.crearReclamo(request, usuario));
    }

    @GetMapping("/mis-reclamos")
    public ResponseEntity<List<ReclamoResponse>> listarMisReclamos(
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(reclamoService.listarMisReclamos(usuario));
    }
}