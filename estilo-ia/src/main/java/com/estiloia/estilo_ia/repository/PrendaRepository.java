package com.estiloia.estilo_ia.repository;

import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.CategoriaPrenda;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface PrendaRepository extends JpaRepository<Prenda, Long> {

    List<Prenda> findByUsuarioAndEliminadoFalse(Usuario usuario);

    List<Prenda> findByUsuarioAndEstadoPublicacionAndEliminadoFalse(
            Usuario usuario,
            EstadoPublicacion estadoPublicacion
    );

    Long countByUsuarioAndEstadoPublicacionAndEliminadoFalse(
            Usuario usuario,
            EstadoPublicacion estadoPublicacion
    );

    List<Prenda> findByEstadoPublicacionAndEliminadoFalse(
            EstadoPublicacion estadoPublicacion
    );

    List<Prenda> findByCategoriaAndEstadoPublicacionAndEliminadoFalse(
            CategoriaPrenda categoria,
            EstadoPublicacion estadoPublicacion
    );

    List<Prenda> findByPrecioBetweenAndEstadoPublicacionAndEliminadoFalse(
            BigDecimal precioMinimo,
            BigDecimal precioMaximo,
            EstadoPublicacion estadoPublicacion
    );

    List<Prenda> findByCategoriaAndPrecioBetweenAndEstadoPublicacionAndEliminadoFalse(
            CategoriaPrenda categoria,
            BigDecimal precioMinimo,
            BigDecimal precioMaximo,
            EstadoPublicacion estadoPublicacion
    );

    List<Prenda> findByNombreContainingIgnoreCaseOrMarcaContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
            String nombre,
            String marca,
            String descripcion
    );

    Long countByEliminadoFalse();

    Long countByEstadoPublicacionAndEliminadoFalse(EstadoPublicacion estadoPublicacion);
}