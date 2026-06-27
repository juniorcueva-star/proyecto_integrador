package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.ResenaRequest;
import com.estiloia.estilo_ia.dto.ResenaResponse;
import com.estiloia.estilo_ia.entity.Resena;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoUsuario;
import com.estiloia.estilo_ia.repository.ResenaRepository;
import com.estiloia.estilo_ia.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResenaService {

    private final ResenaRepository resenaRepository;
    private final UsuarioRepository usuarioRepository;

    public ResenaResponse crearResena(ResenaRequest request, Usuario autor) {
        Usuario receptor = usuarioRepository.findByIdAndEliminadoFalse(request.receptorId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario receptor no encontrado"));

        if (receptor.getEstadoUsuario() != EstadoUsuario.ACTIVO) {
            throw new IllegalStateException("No se puede reseñar a un usuario inactivo");
        }

        if (autor.getId().equals(receptor.getId())) {
            throw new IllegalArgumentException("No puedes dejarte una reseña a ti mismo");
        }

        if (resenaRepository.existsByAutorAndReceptorAndEliminadoFalse(autor, receptor)) {
            throw new IllegalArgumentException("Ya dejaste una reseña a este usuario");
        }

        Resena resena = Resena.builder()
                .autor(autor)
                .receptor(receptor)
                .calificacion(request.calificacion())
                .comentario(request.comentario())
                .eliminado(false)
                .build();

        return ResenaResponse.desdeEntidad(resenaRepository.save(resena));
    }

    public List<ResenaResponse> listarResenasRecibidas(Usuario receptor) {
        return resenaRepository.findByReceptorAndEliminadoFalse(receptor)
                .stream()
                .sorted(Comparator.comparing(Resena::getFecha).reversed())
                .map(ResenaResponse::desdeEntidad)
                .toList();
    }

    public List<ResenaResponse> listarResenasDeUsuario(Long usuarioId) {
        Usuario receptor = usuarioRepository.findByIdAndEliminadoFalse(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return resenaRepository.findByReceptorAndEliminadoFalse(receptor)
                .stream()
                .sorted(Comparator.comparing(Resena::getFecha).reversed())
                .map(ResenaResponse::desdeEntidad)
                .toList();
    }

    public Double calcularPromedioCalificacion(Usuario usuario) {
        List<Resena> resenas = resenaRepository.findByReceptorAndEliminadoFalse(usuario);

        if (resenas.isEmpty()) {
            return 0.0;
        }

        double promedio = resenas.stream()
                .mapToInt(Resena::getCalificacion)
                .average()
                .orElse(0.0);

        return Math.round(promedio * 10.0) / 10.0;
    }

    public Long contarResenasRecibidas(Usuario usuario) {
        return resenaRepository.countByReceptorAndEliminadoFalse(usuario);
    }
}