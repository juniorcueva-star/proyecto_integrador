package com.estiloia.estilo_ia.entity;

import com.estiloia.estilo_ia.enums.EstadoUsuario;
import com.estiloia.estilo_ia.enums.Rol;
import jakarta.persistence.*;
import lombok.*;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Entidad Usuario.
 * Representa a los usuarios registrados en la plataforma Estilo IA.
 *
 * Implementa UserDetails para integrarse con Spring Security.
 */
@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nombre visible del usuario.
     */
    @Column(nullable = false, length = 100)
    private String nombre;

    /**
     * Correo usado para iniciar sesion.
     * Debe ser unico en la plataforma.
     */
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /**
     * Password encriptado con BCrypt.
     * Nunca se guarda la contrasena en texto plano.
     */
    @Column(nullable = false)
    private String password;

    /**
     * Telefono o WhatsApp del usuario.
     */
    @Column(nullable = false, length = 9)
    private String telefono;

    /**
     * Rol del usuario: ROLE_USER o ROLE_ADMIN.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Rol rol;

    /**
     * Estado de la cuenta.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoUsuario estadoUsuario;

    /**
     * Fecha de creacion de la cuenta.
     */
    @Column(nullable = false)
    private LocalDateTime fechaRegistro;

    /**
     * Campo para borrado logico.
     * false = usuario visible/activo en BD.
     * true = usuario eliminado logicamente.
     */
    @Column(nullable = false)
    private Boolean eliminado;

    /**
     * Se ejecuta antes de guardar el usuario por primera vez.
     */
    @PrePersist
    public void prePersist() {
        this.fechaRegistro = LocalDateTime.now();

        if (this.estadoUsuario == null) {
            this.estadoUsuario = EstadoUsuario.ACTIVO;
        }

        if (this.eliminado == null) {
            this.eliminado = false;
        }

        if (this.rol == null) {
            this.rol = Rol.ROLE_USER;
        }
    }

    /**
     * Spring Security usa esto para conocer los permisos del usuario.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(this.rol.name()));
    }

    /**
     * Spring Security usara el email como username.
     */
    @Override
    public String getUsername() {
        return this.email;
    }

    /**
     * Indica si la cuenta no esta expirada.
     */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /**
     * Si el usuario esta baneado o eliminado, no podra autenticarse.
     */
    @Override
    public boolean isAccountNonLocked() {
        return this.estadoUsuario == EstadoUsuario.ACTIVO && !this.eliminado;
    }

    /**
     * Indica si las credenciales no estan expiradas.
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Indica si el usuario esta habilitado.
     */
    @Override
    public boolean isEnabled() {
        return this.estadoUsuario == EstadoUsuario.ACTIVO && !this.eliminado;
    }
}