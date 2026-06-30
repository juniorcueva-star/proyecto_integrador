package com.estiloia.estilo_ia.service;

import com.estiloia.estilo_ia.dto.AuthResponse;
import com.estiloia.estilo_ia.dto.LoginRequest;
import com.estiloia.estilo_ia.dto.RegistroRequest;
import com.estiloia.estilo_ia.entity.Usuario;
import com.estiloia.estilo_ia.enums.EstadoUsuario;
import com.estiloia.estilo_ia.enums.Rol;
import com.estiloia.estilo_ia.repository.UsuarioRepository;
import com.estiloia.estilo_ia.security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio para registro y login.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registra un nuevo usuario normal.
     */
    public AuthResponse registrar(RegistroRequest request) {
        String nombreNormalizado = normalizarNombre(request.nombre());
        String emailNormalizado = normalizarEmail(request.email());
        String telefonoNormalizado = normalizarTelefono(request.telefono());

        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new IllegalArgumentException("Ya existe una cuenta registrada con ese email");
        }
        if (usuarioRepository.existsByTelefono(telefonoNormalizado)) {
            throw new IllegalArgumentException("Ya existe una cuenta registrada con ese celular");
        }

        Usuario usuario = Usuario.builder()
                .nombre(nombreNormalizado)
                .email(emailNormalizado)
                .password(passwordEncoder.encode(request.password()))
                .telefono(telefonoNormalizado)
                .rol(Rol.ROLE_USER)
                .estadoUsuario(EstadoUsuario.ACTIVO)
                .eliminado(false)
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        String token = jwtService.generarToken(usuarioGuardado);

        return new AuthResponse(
                token,
                "Bearer",
                usuarioGuardado.getId(),
                usuarioGuardado.getNombre(),
                usuarioGuardado.getEmail(),
                usuarioGuardado.getRol().name()
        );
    }

    /**
     * Inicia sesion y devuelve un token JWT.
     */
    public AuthResponse login(LoginRequest request) {
        String emailNormalizado = normalizarEmail(request.email());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        emailNormalizado,
                        request.password()
                )
        );

        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (usuario.getEstadoUsuario() != EstadoUsuario.ACTIVO || usuario.getEliminado()) {
            throw new IllegalStateException("La cuenta no esta activa");
        }

        String token = jwtService.generarToken(usuario);

        return new AuthResponse(
                token,
                "Bearer",
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol().name()
        );
    }

    private String normalizarNombre(String nombre) {
        String valor = nombre == null ? "" : nombre.trim().replaceAll("\\s+", " ");
        if (!valor.matches("^[\\p{L}]+(?:\\s+[\\p{L}]+)*$")) {
            throw new IllegalArgumentException("El nombre solo puede contener letras y espacios");
        }
        if (valor.length() < 3 || valor.length() > 60) {
            throw new IllegalArgumentException("El nombre debe tener entre 3 y 60 caracteres");
        }
        return valor;
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizarTelefono(String telefono) {
        String valor = telefono == null ? "" : telefono.trim();
        if (!valor.matches("9\\d{8}")) {
            throw new IllegalArgumentException("El celular debe empezar con 9 y tener 9 digitos");
        }
        return valor;
    }
}
