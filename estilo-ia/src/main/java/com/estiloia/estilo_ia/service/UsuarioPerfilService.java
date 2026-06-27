package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.*;
import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import com.estiloia.estilo_ia.enums.EstadoUsuario;
import com.estiloia.estilo_ia.repository.PrendaRepository;
import com.estiloia.estilo_ia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioPerfilService {

    private final UsuarioRepository usuarioRepository;
    private final PrendaRepository prendaRepository;
    private final ResenaService resenaService;
    private final MetodoPagoService metodoPagoService;

    public PerfilPropioResponse obtenerMiPerfil(Usuario usuario) {
        List<Prenda> prendas = prendaRepository.findByUsuarioAndEliminadoFalse(usuario);

        List<PrendaResumenResponse> prendasSubidas = prendas.stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();

        List<PrendaResumenResponse> historialMovimientos = prendas.stream()
                .filter(prenda -> prenda.getEstadoPublicacion() == EstadoPublicacion.VENDIDA
                        || prenda.getEstadoPublicacion() == EstadoPublicacion.INTERCAMBIADA)
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();

        return new PerfilPropioResponse(
                UsuarioResponse.desdeEntidad(usuario),
                resenaService.calcularPromedioCalificacion(usuario),
                resenaService.contarResenasRecibidas(usuario),
                resenaService.listarResenasRecibidas(usuario),
                prendasSubidas,
                historialMovimientos,
                calcularEstadisticas(usuario, prendas)
        );
    }

    public PerfilPublicoResponse obtenerPerfilPublico(Long usuarioId, Usuario solicitante) {
        Usuario vendedor = usuarioRepository.findByIdAndEliminadoFalse(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (solicitante != null && vendedor.getId().equals(solicitante.getId())) {
            throw new IllegalArgumentException("No puedes comprarte prendas a ti mismo");
        }

        if (vendedor.getEstadoUsuario() != EstadoUsuario.ACTIVO) {
            throw new IllegalStateException("El usuario no esta disponible");
        }

        List<PrendaResumenResponse> prendasPublicadas = prendaRepository
                .findByUsuarioAndEstadoPublicacionAndEliminadoFalse(vendedor, EstadoPublicacion.PUBLICADA)
                .stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();

        return new PerfilPublicoResponse(
                vendedor.getId(),
                vendedor.getNombre(),
                vendedor.getTelefono(),
                resenaService.calcularPromedioCalificacion(vendedor),
                resenaService.contarResenasRecibidas(vendedor),
                resenaService.listarResenasRecibidas(vendedor),
                prendasPublicadas,
                metodoPagoService.listarMetodosActivosDeUsuario(vendedor)
        );
    }

    private EstadisticasUsuarioResponse calcularEstadisticas(Usuario usuario, List<Prenda> prendas) {
        Long publicadas = contarPorEstado(usuario, EstadoPublicacion.PUBLICADA);
        Long vendidas = contarPorEstado(usuario, EstadoPublicacion.VENDIDA);
        Long intercambiadas = contarPorEstado(usuario, EstadoPublicacion.INTERCAMBIADA);

        BigDecimal dineroRecaudado = prendas.stream()
                .filter(prenda -> prenda.getEstadoPublicacion() == EstadoPublicacion.VENDIDA)
                .map(Prenda::getPrecio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new EstadisticasUsuarioResponse(
                (long) prendas.size(),
                publicadas,
                vendidas,
                intercambiadas,
                dineroRecaudado,
                intercambiadas
        );
    }

    private Long contarPorEstado(Usuario usuario, EstadoPublicacion estado) {
        return prendaRepository.countByUsuarioAndEstadoPublicacionAndEliminadoFalse(usuario, estado);
    }
}
