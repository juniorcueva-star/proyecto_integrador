package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.PrendaRequest;
import com.estiloia.estilo_ia.dto.PrendaResponse;
import com.estiloia.estilo_ia.dto.PrendaResumenResponse;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.*;
import com.estiloia.estilo_ia.service.PrendaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/prendas")
@RequiredArgsConstructor
public class PrendaController {

    private final PrendaService prendaService;

    @PostMapping
    public ResponseEntity<PrendaResponse> crearPrenda(
            @Valid @RequestBody PrendaRequest request,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(prendaService.crearPrenda(request, usuario));
    }

    @PostMapping(value = "/con-imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrendaResponse> crearPrendaConImagen(
            @RequestParam String nombre,
            @RequestParam String descripcion,
            @RequestParam String marca,
            @RequestParam String color,
            @RequestParam TallaPrenda talla,
            @RequestParam CategoriaPrenda categoria,
            @RequestParam EstadoFisicoPrenda estadoFisico,
            @RequestParam BigDecimal precio,
            @RequestParam TipoPublicacion tipoPublicacion,
            @RequestParam String contacto,
            @RequestParam MultipartFile imagen,
            @AuthenticationPrincipal Usuario usuario
    ) {
        PrendaResponse response = prendaService.crearPrendaConImagen(
                nombre,
                descripcion,
                marca,
                color,
                talla,
                categoria,
                estadoFisico,
                precio,
                tipoPublicacion,
                contacto,
                imagen,
                usuario
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping(value = "/{id}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrendaResponse> actualizarImagen(
            @PathVariable Long id,
            @RequestParam MultipartFile imagen,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.actualizarImagen(id, imagen, usuario));
    }

    @GetMapping("/mis-prendas")
    public ResponseEntity<List<PrendaResumenResponse>> listarMisPrendas(
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.listarMisPrendas(usuario));
    }

    @GetMapping("/mis-prendas/{id}")
    public ResponseEntity<PrendaResponse> obtenerMiPrenda(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.obtenerMiPrenda(id, usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrendaResponse> editarPrenda(
            @PathVariable Long id,
            @Valid @RequestBody PrendaRequest request,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.editarPrenda(id, request, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarPrenda(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        prendaService.eliminarPrenda(id, usuario);
        return ResponseEntity.ok("Prenda eliminada correctamente");
    }

    @PatchMapping("/{id}/vendida")
    public ResponseEntity<PrendaResponse> marcarComoVendida(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.marcarComoVendida(id, usuario));
    }

    @PatchMapping("/{id}/intercambiada")
    public ResponseEntity<PrendaResponse> marcarComoIntercambiada(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.marcarComoIntercambiada(id, usuario));
    }

    @PatchMapping("/{id}/pausar")
    public ResponseEntity<PrendaResponse> pausarPrenda(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.pausarPrenda(id, usuario));
    }

    @PatchMapping("/{id}/publicar")
    public ResponseEntity<PrendaResponse> volverAPublicar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario
    ) {
        return ResponseEntity.ok(prendaService.volverAPublicar(id, usuario));
    }

    @GetMapping("/catalogo")
    public ResponseEntity<List<PrendaResumenResponse>> listarCatalogo() {
        return ResponseEntity.ok(prendaService.listarPrendasPublicadas());
    }

    @GetMapping("/catalogo/buscar")
    public ResponseEntity<List<PrendaResumenResponse>> buscarCatalogo(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) CategoriaPrenda categoria,
            @RequestParam(required = false) BigDecimal precioMinimo,
            @RequestParam(required = false) BigDecimal precioMaximo
    ) {
        return ResponseEntity.ok(
                prendaService.buscarCatalogo(texto, categoria, precioMinimo, precioMaximo)
        );
    }

    @GetMapping("/catalogo/{id}")
    public ResponseEntity<PrendaResponse> obtenerDetalleCatalogo(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(prendaService.obtenerDetalle(id));
    }
}
