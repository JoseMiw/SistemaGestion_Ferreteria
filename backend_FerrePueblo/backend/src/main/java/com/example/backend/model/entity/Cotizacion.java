package com.example.backend.model.entity;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/** Cotización de un proveedor (RF04). */
@Entity
@Table(name = "cotizacion")
@Data
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Cotizacion {
    public static final String ESTADO_REGISTRADA = "REGISTRADA";
    public static final String ESTADO_ORDENADA = "ORDENADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idCotizacion")
    private Integer idCotizacion;

    @Column(name = "fechaCotizacion", nullable = false)
    private LocalDate fechaCotizacion;

    @Column(name = "fechaVigencia", nullable = false)
    private LocalDate fechaVigencia;

    @Column(name = "montoTotal", nullable = false)
    private Double montoTotal;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = ESTADO_REGISTRADA;

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

    @ManyToOne
    @JoinColumn(name = "idSolicitudCompra")
    @JsonIgnoreProperties({"detalleSolicitud", "proveedor", "usuario"})
    @ToString.Exclude
    private SolicitudCompra solicitudCompra;

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("cotizacion")
    @ToString.Exclude
    private List<DetalleCotizacion> detalleCotizacion;

    public Cotizacion(Integer idCotizacion) {
        this.idCotizacion = idCotizacion;
    }
}
