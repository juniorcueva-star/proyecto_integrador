package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.ReclamoAdminUpdateRequest;
import com.estiloia.estilo_ia.dto.ReclamoRequest;
import com.estiloia.estilo_ia.dto.ReclamoResponse;
import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Reclamo;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoReclamo;
import com.estiloia.estilo_ia.repository.PrendaRepository;
import com.estiloia.estilo_ia.repository.ReclamoRepository;
import com.estiloia.estilo_ia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReclamoService {

    private final ReclamoRepository reclamoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PrendaRepository prendaRepository;

    public ReclamoResponse crearReclamo(ReclamoRequest request, Usuario usuarioCreador) {
        Usuario usuarioReportado = null;
        Prenda prenda = null;

        if (request.usuarioReportadoId() != null) {
            usuarioReportado = usuarioRepository.findById(request.usuarioReportadoId())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario reportado no encontrado"));
        }

        if (request.prendaId() != null) {
            prenda = prendaRepository.findById(request.prendaId())
                    .orElseThrow(() -> new IllegalArgumentException("Prenda no encontrada"));
        }

        if (usuarioReportado != null && usuarioReportado.getId().equals(usuarioCreador.getId())) {
            throw new IllegalArgumentException("No puedes hacer un reclamo contra ti mismo");
        }

        if (prenda != null && prenda.getUsuario() != null && prenda.getUsuario().getId().equals(usuarioCreador.getId())) {
            throw new IllegalArgumentException("No puedes hacer un reclamo sobre tu propia prenda");
        }

        if (usuarioReportado != null && prenda != null && prenda.getUsuario() != null
                && !prenda.getUsuario().getId().equals(usuarioReportado.getId())) {
            throw new IllegalArgumentException("La prenda reportada no pertenece al usuario reportado");
        }

        Reclamo reclamo = Reclamo.builder()
                .usuarioCreador(usuarioCreador)
                .usuarioReportado(usuarioReportado)
                .prenda(prenda)
                .motivo(request.motivo())
                .descripcion(request.descripcion())
                .estado(EstadoReclamo.PENDIENTE)
                .build();

        return ReclamoResponse.desdeEntidad(reclamoRepository.save(reclamo));
    }

    public List<ReclamoResponse> listarMisReclamos(Usuario usuario) {
        return reclamoRepository.findByUsuarioCreadorOrderByFechaCreacionDesc(usuario)
                .stream()
                .map(ReclamoResponse::desdeEntidad)
                .toList();
    }

    public List<ReclamoResponse> listarTodos() {
        return reclamoRepository.findAllByOrderByFechaCreacionDesc()
                .stream()
                .map(ReclamoResponse::desdeEntidad)
                .toList();
    }

    public List<ReclamoResponse> listarPorEstado(EstadoReclamo estado) {
        return reclamoRepository.findByEstadoOrderByFechaCreacionDesc(estado)
                .stream()
                .map(ReclamoResponse::desdeEntidad)
                .toList();
    }

    public ReclamoResponse obtenerDetalle(Long id) {
        Reclamo reclamo = reclamoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reclamo no encontrado"));

        return ReclamoResponse.desdeEntidad(reclamo);
    }

    public ReclamoResponse actualizarReclamo(Long id, ReclamoAdminUpdateRequest request) {
        Reclamo reclamo = reclamoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reclamo no encontrado"));

        reclamo.setEstado(request.estado());
        reclamo.setRespuestaAdmin(request.respuestaAdmin());

        return ReclamoResponse.desdeEntidad(reclamoRepository.save(reclamo));
    }

    public Long contarPorEstado(EstadoReclamo estado) {
        return reclamoRepository.countByEstado(estado);
    }
}
