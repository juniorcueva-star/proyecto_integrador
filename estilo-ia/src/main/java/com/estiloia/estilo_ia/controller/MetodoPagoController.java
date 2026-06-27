package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.MetodoPagoRequest;
import com.estiloia.estilo_ia.dto.MetodoPagoResponse;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.TipoMetodoPago;
import com.estiloia.estilo_ia.service.MetodoPagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/metodos-pago")
@RequiredArgsConstructor
public class MetodoPagoController {

    private final MetodoPagoService metodoPagoService;

    @PostMapping
    public ResponseEntity<MetodoPagoResponse> crearMetodoPago(
            @Valid @RequestBody MetodoPagoRequest request,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(metodoPagoService.crearMetodoPago(request, usuario));
    }

    @PostMapping(value = "/con-qr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MetodoPagoResponse> crearMetodoPagoConQr(
            @RequestParam TipoMetodoPago tipoMetodoPago,
            @RequestParam(required = false) String numero,
            @RequestParam(required = false) String titular,
            @RequestParam(required = false) String instrucciones,
            @RequestParam(required = false) MultipartFile imagenQr,
            @AuthenticationPrincipal Usuario usuario
    ) {
        MetodoPagoRequest request = new MetodoPagoRequest(
                tipoMetodoPago,
                numero,
                titular,
                null,
                instrucciones
        );

        return ResponseEntity.ok(metodoPagoService.crearMetodoPagoConQr(request, imagenQr, usuario));
    }

    @GetMapping("/mis-metodos")
    public ResponseEntity<List<MetodoPagoResponse>> listarMisMetodos(
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(metodoPagoService.listarMisMetodos(usuario));
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<MetodoPagoResponse> activarMetodo(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(metodoPagoService.activarMetodo(id, usuario));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<MetodoPagoResponse> desactivarMetodo(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(metodoPagoService.desactivarMetodo(id, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarMetodo(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        metodoPagoService.eliminarMetodo(id, usuario);
        return ResponseEntity.ok("Metodo de pago eliminado correctamente");
    }
}