package com.estiloia.estilo_ia.config;

import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoUsuario;
import com.estiloia.estilo_ia.enums.Rol;
import com.estiloia.estilo_ia.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea un usuario administrador inicial al arrancar la aplicacion.
 * Solo se crea si no existe previamente.
 */
@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        String adminEmail = "admin@estiloia.com";

        if (!usuarioRepository.existsByEmail(adminEmail)) {

            Usuario admin = Usuario.builder()
                    .nombre("Administrador Estilo IA")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin12345"))
                    .telefono("999999999")
                    .rol(Rol.ROLE_ADMIN)
                    .estadoUsuario(EstadoUsuario.ACTIVO)
                    .eliminado(false)
                    .build();

            usuarioRepository.save(admin);

            System.out.println("=======================================");
            System.out.println("ADMIN INICIAL CREADO");
            System.out.println("Email: admin@estiloia.com");
            System.out.println("Password: Admin12345");
            System.out.println("=======================================");
        }
    }
}