package com.example.backend.model.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/** Orden de compra creada desde una cotización y aprobada por el gerente (RF05). */
@Entity
@Table(name = "orden_compra")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrdenCompra {
    public static final String ESTADO_PENDIENTE = "PENDIENTE";
    public static final String ESTADO_APROBADA = "APROBADA";
    public static final String ESTADO_RECHAZADA = "RECHAZADA";
    public static final String ESTADO_ENTREGADA = "ENTREGADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idOrdenCompra")
    private Integer idOrdenCompra;

    @Column(name = "fechaOrden", nullable = false)
    private LocalDate fechaOrden;

    @Column(name = "montoTotal", nullable = false)
    private Double montoTotal;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = ESTADO_PENDIENTE;

    @OneToOne
    @JoinColumn(name = "idCotizacion", nullable = false, unique = true)
    @ToString.Exclude
    private Cotizacion cotizacion;

    @ManyToOne
    @JoinColumn(name = "idProveedor", nullable = false)
    @JsonIgnoreProperties({"solicitudes", "productos"})
    @ToString.Exclude
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "idUsuarioCreador", nullable = false)
    @JsonIgnoreProperties({"ventas", "solicitudes"})
    @ToString.Exclude
    private Usuario usuarioCreador;

    @ManyToOne
    @JoinColumn(name = "idUsuarioAprobador")
    @JsonIgnoreProperties({"ventas", "solicitudes"})
    @ToString.Exclude
    private Usuario usuarioAprobador;

    @Column(name = "fechaAprobacion")
    private LocalDateTime fechaAprobacion;
}
