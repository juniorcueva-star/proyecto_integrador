package com.estiloia.estilo_ia.security;

import com.estiloia.estilo_ia.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio encargado de generar, leer y validar tokens JWT.
 */
@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private Long jwtExpirationMs;

    /**
     * Genera un token JWT para un usuario autenticado.
     */
    public String generarToken(Usuario usuario) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", usuario.getId());
        claims.put("nombre", usuario.getNombre());
        claims.put("rol", usuario.getRol().name());

        return Jwts.builder()
                .claims(claims)
                .subject(usuario.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(obtenerClaveSecreta())
                .compact();
    }

    /**
     * Extrae el email del token.
     */
    public String extraerEmail(String token) {
        return extraerClaims(token).getSubject();
    }

    /**
     * Valida que el token pertenezca al usuario y no este expirado.
     */
    public boolean tokenValido(String token, UserDetails userDetails) {
        String email = extraerEmail(token);
        return email.equals(userDetails.getUsername()) && !tokenExpirado(token);
    }

    /**
     * Verifica si el token ya expiro.
     */
    private boolean tokenExpirado(String token) {
        return extraerClaims(token).getExpiration().before(new Date());
    }

    /**
     * Extrae todos los claims del token.
     */
    private Claims extraerClaims(String token) {
        return Jwts.parser()
                .verifyWith(obtenerClaveSecreta())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Crea la clave secreta para firmar y validar el JWT.
     */
    private SecretKey obtenerClaveSecreta() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}