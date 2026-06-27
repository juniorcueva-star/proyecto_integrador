package com.estiloia.estilo_ia.entity;

import com.estiloia.estilo_ia.enums.TipoMetodoPago;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "metodos_pago")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetodoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoMetodoPago tipoMetodoPago;

    @Column(length = 30)
    private String numero;

    @Column(length = 120)
    private String titular;

    @Column(length = 500)
    private String imagenQrUrl;

    @Column(columnDefinition = "TEXT")
    private String instrucciones;

    @Column(nullable = false)
    private Boolean activo;

    @Column(nullable = false)
    private LocalDateTime fechaRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @PrePersist
    public void prePersist() {
        this.fechaRegistro = LocalDateTime.now();

        if (this.activo == null) {
            this.activo = true;
        }
    }
}