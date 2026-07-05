package com.estiloia.estilo_ia.entity;

import com.estiloia.estilo_ia.enums.CategoriaPrenda;
import com.estiloia.estilo_ia.enums.EstadoFisicoPrenda;
import com.estiloia.estilo_ia.enums.EstadoPublicacion;
import com.estiloia.estilo_ia.enums.GeneroPrenda;
import com.estiloia.estilo_ia.enums.TallaPrenda;
import com.estiloia.estilo_ia.enums.TipoPublicacion;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad Prenda.
 * Representa una publicacion dentro del marketplace Estilo IA.
 */
@Entity
@Table(name = "prendas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nombre comercial de la prenda.
     * Ejemplo: Polo oversize negro.
     */
    @Column(nullable = false, length = 120)
    private String nombre;

    /**
     * Descripcion detallada de la prenda.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    /**
     * Marca de la prenda.
     */
    @Column(nullable = false, length = 100)
    private String marca;

    /**
     * Publico objetivo de la prenda: hombre, mujer o unisex.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'UNISEX'")
    private GeneroPrenda genero;

    /**
     * Color principal de la prenda.
     */
    @Column(nullable = false, length = 60)
    private String color;

    /**
     * Talla seleccionada.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TallaPrenda talla;

    /**
     * Categoria de la prenda.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CategoriaPrenda categoria;

    /**
     * Estado fisico real.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EstadoFisicoPrenda estadoFisico;

    /**
     * Precio de venta.
     * Puede ser 0 si la publicacion es solo para intercambio.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    /**
     * Tipo de publicacion: venta, intercambio o ambos.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoPublicacion tipoPublicacion;

    /**
     * Estado actual de la publicacion.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EstadoPublicacion estadoPublicacion;

    /**
     * Telefono o WhatsApp de contacto.
     */
    @Column(nullable = false, length = 30)
    private String contacto;

    /**
     * Ruta o URL de la imagen.
     * Por ahora puede quedar vacia o guardar una ruta simulada.
     * En FASE 8 se implementara subida real de imagenes.
     */
    @Column(length = 500)
    private String imagenUrl;

    /**
     * Usuario propietario de la prenda.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /**
     * Fecha en la que se publico la prenda.
     */
    @Column(nullable = false)
    private LocalDateTime fechaPublicacion;

    /**
     * Borrado logico de la prenda.
     */
    @Column(nullable = false)
    private Boolean eliminado;

    /**
     * Valores automaticos antes de guardar por primera vez.
     */
    @PrePersist
    public void prePersist() {
        this.fechaPublicacion = LocalDateTime.now();

        if (this.estadoPublicacion == null) {
            this.estadoPublicacion = EstadoPublicacion.PUBLICADA;
        }

        if (this.eliminado == null) {
            this.eliminado = false;
        }

        if (this.imagenUrl == null || this.imagenUrl.isBlank()) {
            this.imagenUrl = "/img/prenda-default.png";
        }

        if (this.genero == null) {
            this.genero = GeneroPrenda.UNISEX;
        }
    }

    @PreUpdate
    public void preUpdate() {
        if (this.genero == null) {
            this.genero = GeneroPrenda.UNISEX;
        }
    }
}
