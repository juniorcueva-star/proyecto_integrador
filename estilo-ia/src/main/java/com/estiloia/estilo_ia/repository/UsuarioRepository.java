package com.estiloia.estilo_ia.repository;

import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByTelefono(String telefono);

    List<Usuario> findByEstadoUsuario(EstadoUsuario estadoUsuario);

    Optional<Usuario> findByIdAndEliminadoFalse(Long id);

    List<Usuario> findByEliminadoFalse();

    List<Usuario> findByNombreContainingIgnoreCaseOrEmailContainingIgnoreCaseAndEliminadoFalse(
            String nombre,
            String email
    );

    Long countByEliminadoFalse();

    Long countByEstadoUsuarioAndEliminadoFalse(EstadoUsuario estadoUsuario);
}
