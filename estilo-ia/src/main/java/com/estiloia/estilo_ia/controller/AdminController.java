package com.estiloia.estilo_ia.controller;

import com.estiloia.estilo_ia.dto.*;
import com.estiloia.estilo_ia.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.estiloia.estilo_ia.dto.ReclamoAdminUpdateRequest;
import com.estiloia.estilo_ia.dto.ReclamoResponse;
import com.estiloia.estilo_ia.enums.EstadoReclamo;
import com.estiloia.estilo_ia.service.ReclamoService;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ReclamoService reclamoService;

    @GetMapping("/dashboard")
    public ResponseEntity<String> dashboardAdmin() {
        return ResponseEntity.ok("Acceso correcto al dashboard ADMIN");
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<AdminUsuarioResumenResponse>> listarUsuarios() {
        return ResponseEntity.ok(adminService.listarUsuarios());
    }



    @GetMapping("/usuarios/buscar")
    public ResponseEntity<List<AdminUsuarioResumenResponse>> buscarUsuarios(
            @RequestParam(required = false) String texto
    ) {
        return ResponseEntity.ok(adminService.buscarUsuarios(texto));
    }

    @GetMapping("/usuarios/{id}")
    public ResponseEntity<AdminUsuarioDetalleResponse> obtenerDetalleUsuario(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(adminService.obtenerDetalleUsuario(id));
    }

    @GetMapping("/usuarios/{id}/prendas")
    public ResponseEntity<List<PrendaResumenResponse>> listarPrendasDeUsuario(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(adminService.listarPrendasDeUsuario(id));
    }

    @GetMapping("/usuarios/{id}/resenas")
    public ResponseEntity<List<ResenaResponse>> listarResenasDeUsuario(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(adminService.listarResenasDeUsuario(id));
    }

    @PatchMapping("/usuarios/{id}/banear")
    public ResponseEntity<AdminUsuarioResumenResponse> banearUsuario(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(adminService.banearUsuario(id));
    }

    @PatchMapping("/usuarios/{id}/reactivar")
    public ResponseEntity<AdminUsuarioResumenResponse> reactivarUsuario(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(adminService.reactivarUsuario(id));
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<AdminUsuarioResumenResponse> eliminarUsuario(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(adminService.eliminarUsuario(id));
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<AdminEstadisticasResponse> obtenerEstadisticasGenerales() {
        return ResponseEntity.ok(adminService.obtenerEstadisticasGenerales());
    }
    @GetMapping("/reclamos")
    public ResponseEntity<List<ReclamoResponse>> listarReclamos(
            @RequestParam(required = false) EstadoReclamo estado
    ) {
        if (estado != null) {
            return ResponseEntity.ok(reclamoService.listarPorEstado(estado));
        }

        return ResponseEntity.ok(reclamoService.listarTodos());
    }

    @GetMapping("/reclamos/{id}")
    public ResponseEntity<ReclamoResponse> obtenerReclamo(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(reclamoService.obtenerDetalle(id));
    }

    @PatchMapping("/reclamos/{id}")
    public ResponseEntity<ReclamoResponse> actualizarReclamo(
            @PathVariable Long id,
            @Valid @RequestBody ReclamoAdminUpdateRequest request
    ) {
        return ResponseEntity.ok(reclamoService.actualizarReclamo(id, request));
    }
}