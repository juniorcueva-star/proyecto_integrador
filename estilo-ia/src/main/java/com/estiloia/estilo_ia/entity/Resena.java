package com.estiloia.estilo_ia.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resenas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usuario que escribe la reseña
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    // Usuario que recibe la reseña
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptor_id", nullable = false)
    private Usuario receptor;

    @Column(nullable = false)
    private Integer calificacion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comentario;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false)
    private Boolean eliminado;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();

        if (this.eliminado == null) {
            this.eliminado = false;
        }
    }
}