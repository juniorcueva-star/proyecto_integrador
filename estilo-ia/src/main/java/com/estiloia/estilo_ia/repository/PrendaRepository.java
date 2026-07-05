package com.estiloia.estilo_ia.repository;

import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.CategoriaPrenda;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PrendaRepository extends JpaRepository<Prenda, Long> {

    List<Prenda> findByUsuario(Usuario usuario);

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

    @Query("""
            select p
            from Prenda p
            join p.usuario u
            where p.estadoPublicacion = :estadoPublicacion
              and p.eliminado = false
              and u.eliminado = false
              and u.estadoUsuario = com.estiloia.estilo_ia.enums.EstadoUsuario.ACTIVO
            """)
    List<Prenda> findCatalogoVisibleByEstadoPublicacion(
            @Param("estadoPublicacion") EstadoPublicacion estadoPublicacion
    );

    @Query("""
            select p
            from Prenda p
            join p.usuario u
            where p.categoria = :categoria
              and p.precio between :precioMinimo and :precioMaximo
              and p.estadoPublicacion = :estadoPublicacion
              and p.eliminado = false
              and u.eliminado = false
              and u.estadoUsuario = com.estiloia.estilo_ia.enums.EstadoUsuario.ACTIVO
            """)
    List<Prenda> findCatalogoVisibleByCategoriaAndPrecioBetweenAndEstadoPublicacion(
            @Param("categoria") CategoriaPrenda categoria,
            @Param("precioMinimo") BigDecimal precioMinimo,
            @Param("precioMaximo") BigDecimal precioMaximo,
            @Param("estadoPublicacion") EstadoPublicacion estadoPublicacion
    );

    @Query("""
            select p
            from Prenda p
            join p.usuario u
            where p.precio between :precioMinimo and :precioMaximo
              and p.estadoPublicacion = :estadoPublicacion
              and p.eliminado = false
              and u.eliminado = false
              and u.estadoUsuario = com.estiloia.estilo_ia.enums.EstadoUsuario.ACTIVO
            """)
    List<Prenda> findCatalogoVisibleByPrecioBetweenAndEstadoPublicacion(
            @Param("precioMinimo") BigDecimal precioMinimo,
            @Param("precioMaximo") BigDecimal precioMaximo,
            @Param("estadoPublicacion") EstadoPublicacion estadoPublicacion
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
