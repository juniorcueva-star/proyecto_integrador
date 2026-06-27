package com.estiloia.estilo_ia.repository;

import com.estiloia.estilo_ia.entity.MetodoPago;
import com.estiloia.estilo_ia.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Long> {

    List<MetodoPago> findByUsuarioAndActivoTrue(Usuario usuario);

    List<MetodoPago> findByUsuario(Usuario usuario);
}