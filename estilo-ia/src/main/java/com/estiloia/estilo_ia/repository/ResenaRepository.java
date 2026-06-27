package com.estiloia.estilo_ia.repository;

import com.estiloia.estilo_ia.entity.Resena;
import com.estiloia.estilo_ia.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResenaRepository extends JpaRepository<Resena, Long> {

    List<Resena> findByReceptorAndEliminadoFalse(Usuario receptor);

    List<Resena> findByAutorAndEliminadoFalse(Usuario autor);

    boolean existsByAutorAndReceptorAndEliminadoFalse(Usuario autor, Usuario receptor);

    Long countByReceptorAndEliminadoFalse(Usuario receptor);
}