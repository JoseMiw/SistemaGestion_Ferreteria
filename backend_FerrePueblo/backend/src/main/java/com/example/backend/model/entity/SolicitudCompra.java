package com.example.backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "solicitud_compra")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class SolicitudCompra {
    public static final String ESTADO_PENDIENTE = "PENDIENTE";
    // Se registró al menos una cotización a partir de esta solicitud
    public static final String ESTADO_COTIZADA = "COTIZADA";
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idSolicitudCompra")
    private Integer idSolicitudCompra;

    @Column(name = "fechaCotizacion", nullable = false)
    private LocalDate fechaCotizacion;

    @Column(name = "montoTotal", nullable = false)
    private Double montoTotal;

    @Column(length = 20)
    private String estado = "PENDIENTE";

    @ManyToOne
    @JoinColumn(name = "idProveedor", nullable = false)
    @JsonIgnoreProperties({"solicitudes", "productos"})
    @ToString.Exclude
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    @JsonIgnoreProperties({"ventas", "solicitudes"})
    @ToString.Exclude 
    private Usuario usuario;

    @OneToMany(mappedBy = "solicitudCompra", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("solicitudCompra")
    @ToString.Exclude 
    private List<DetalleSolicitudCompra> detalleSolicitud;
}