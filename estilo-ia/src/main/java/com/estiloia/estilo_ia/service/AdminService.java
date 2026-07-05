package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.*;
import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import com.estiloia.estilo_ia.enums.EstadoUsuario;
import com.estiloia.estilo_ia.repository.MetodoPagoRepository;
import com.estiloia.estilo_ia.repository.PrendaRepository;
import com.estiloia.estilo_ia.repository.ReclamoRepository;
import com.estiloia.estilo_ia.repository.ResenaRepository;
import com.estiloia.estilo_ia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UsuarioRepository usuarioRepository;
    private final PrendaRepository prendaRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final ResenaRepository resenaRepository;
    private final ReclamoRepository reclamoRepository;
    private final ResenaService resenaService;

    public List<AdminUsuarioResumenResponse> listarUsuarios() {
        return usuarioRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Usuario::getId).reversed())
                .map(AdminUsuarioResumenResponse::desdeEntidad)
                .toList();
    }

    public List<AdminUsuarioResumenResponse> buscarUsuarios(String texto) {
        if (texto == null || texto.isBlank()) {
            return listarUsuarios();
        }

        return usuarioRepository
                .findByNombreContainingIgnoreCaseOrEmailContainingIgnoreCaseAndEliminadoFalse(texto, texto)
                .stream()
                .sorted(Comparator.comparing(Usuario::getId).reversed())
                .map(AdminUsuarioResumenResponse::desdeEntidad)
                .toList();
    }

    public AdminUsuarioDetalleResponse obtenerDetalleUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        List<PrendaResumenResponse> prendas = prendaRepository.findByUsuarioAndEliminadoFalse(usuario)
                .stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();

        return new AdminUsuarioDetalleResponse(
                AdminUsuarioResumenResponse.desdeEntidad(usuario),
                resenaService.calcularPromedioCalificacion(usuario),
                resenaService.contarResenasRecibidas(usuario),
                prendas,
                resenaService.listarResenasRecibidas(usuario)
        );
    }

    public List<PrendaResumenResponse> listarPrendasDeUsuario(Long id) {
        Usuario usuario = buscarUsuarioPorId(id);

        return prendaRepository.findByUsuarioAndEliminadoFalse(usuario)
                .stream()
                .sorted(Comparator.comparing(Prenda::getFechaPublicacion).reversed())
                .map(PrendaResumenResponse::desdeEntidad)
                .toList();
    }

    public List<ResenaResponse> listarResenasDeUsuario(Long id) {
        Usuario usuario = buscarUsuarioPorId(id);
        return resenaService.listarResenasRecibidas(usuario);
    }

    public AdminUsuarioResumenResponse banearUsuario(Long id) {
        Usuario usuario = buscarUsuarioPorId(id);
        usuario.setEstadoUsuario(EstadoUsuario.BANEADO);
        prendaRepository.findByUsuarioAndEstadoPublicacionAndEliminadoFalse(usuario, EstadoPublicacion.PUBLICADA)
                .forEach(prenda -> prenda.setEstadoPublicacion(EstadoPublicacion.PAUSADA));
        return AdminUsuarioResumenResponse.desdeEntidad(usuarioRepository.save(usuario));
    }

    @Transactional
    public AdminUsuarioResumenResponse reactivarUsuario(Long id) {
        Usuario usuario = buscarUsuarioPorId(id);
        usuario.setEstadoUsuario(EstadoUsuario.ACTIVO);
        usuario.setEliminado(false);
        prendaRepository.findByUsuarioAndEstadoPublicacionAndEliminadoFalse(usuario, EstadoPublicacion.PAUSADA)
                .forEach(prenda -> prenda.setEstadoPublicacion(EstadoPublicacion.PUBLICADA));
        return AdminUsuarioResumenResponse.desdeEntidad(usuarioRepository.save(usuario));
    }

    @Transactional
    public AdminUsuarioResumenResponse eliminarUsuario(Long id) {
        Usuario usuario = buscarUsuarioPorId(id);
        AdminUsuarioResumenResponse resumen = AdminUsuarioResumenResponse.desdeEntidad(usuario);
        List<Prenda> prendas = prendaRepository.findByUsuario(usuario);

        metodoPagoRepository.deleteAll(metodoPagoRepository.findByUsuario(usuario));
        resenaRepository.deleteAll(resenaRepository.findByAutorAndEliminadoFalse(usuario));
        resenaRepository.deleteAll(resenaRepository.findByReceptorAndEliminadoFalse(usuario));
        reclamoRepository.deleteAll(reclamoRepository.findByUsuarioCreadorOrderByFechaCreacionDesc(usuario));
        reclamoRepository.deleteAll(reclamoRepository.findByUsuarioReportado(usuario));

        if (!prendas.isEmpty()) {
            reclamoRepository.deleteAll(reclamoRepository.findByPrendaIn(prendas));
            prendaRepository.deleteAll(prendas);
        }

        usuarioRepository.delete(usuario);
        return resumen;
    }

    public AdminEstadisticasResponse obtenerEstadisticasGenerales() {
        Long usuariosTotales = usuarioRepository.countByEliminadoFalse();
        Long usuariosActivos = usuarioRepository.countByEstadoUsuarioAndEliminadoFalse(EstadoUsuario.ACTIVO);
        Long usuariosBaneados = usuarioRepository.countByEstadoUsuarioAndEliminadoFalse(EstadoUsuario.BANEADO);

        Long prendasPublicadas = prendaRepository.countByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.PUBLICADA);
        Long prendasVendidas = prendaRepository.countByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.VENDIDA);
        Long prendasIntercambiadas = prendaRepository.countByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.INTERCAMBIADA);

        BigDecimal dineroTotal = prendaRepository.findByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion.VENDIDA)
                .stream()
                .map(Prenda::getPrecio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Long prendasReutilizadas = prendasVendidas + prendasIntercambiadas;

        // Estimacion simple: cada prenda reutilizada evita aprox. 2.5 kg CO2.
        Double impactoAmbiental = prendasReutilizadas * 2.5;

        return new AdminEstadisticasResponse(
                usuariosTotales,
                usuariosActivos,
                usuariosBaneados,
                prendasPublicadas,
                prendasVendidas,
                prendasIntercambiadas,
                dineroTotal,
                prendasReutilizadas,
                impactoAmbiental
        );
    }

    private Usuario buscarUsuarioPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }
}
