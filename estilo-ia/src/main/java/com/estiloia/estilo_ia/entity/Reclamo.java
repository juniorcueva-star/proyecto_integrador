package com.estiloia.estilo_ia.entity;

import com.estiloia.estilo_ia.enums.EstadoReclamo;
import com.estiloia.estilo_ia.enums.MotivoReclamo;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reclamos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reclamo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_creador_id", nullable = false)
    private Usuario usuarioCreador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_reportado_id")
    private Usuario usuarioReportado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prenda_id")
    private Prenda prenda;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private MotivoReclamo motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private EstadoReclamo estado;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(columnDefinition = "TEXT")
    private String respuestaAdmin;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = EstadoReclamo.PENDIENTE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
