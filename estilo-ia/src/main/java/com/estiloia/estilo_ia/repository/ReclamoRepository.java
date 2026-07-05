package com.estiloia.estilo_ia.repository;

import com.estiloia.estilo_ia.entity.Reclamo;
import com.estiloia.estilo_ia.entity.Prenda;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoReclamo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamoRepository extends JpaRepository<Reclamo, Long> {

    List<Reclamo> findByUsuarioCreadorOrderByFechaCreacionDesc(Usuario usuario);

    List<Reclamo> findByUsuarioReportado(Usuario usuario);

    List<Reclamo> findByPrendaIn(List<Prenda> prendas);

    List<Reclamo> findByEstadoOrderByFechaCreacionDesc(EstadoReclamo estado);

    List<Reclamo> findAllByOrderByFechaCreacionDesc();

    Long countByEstado(EstadoReclamo estado);
}
