package com.example.backend.model.entity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "devolucion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Devolucion {
    public static final String TIPO_REEMBOLSO = "REEMBOLSO";
    public static final String TIPO_CAMBIO = "CAMBIO";
    public static final String ESTADO_APROBADA = "APROBADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDevolucion")
    private Integer idDevolucion;

    @Column(name = "fechaDevolucion", nullable = false)
    private LocalDate fechaDevolucion;

    @Column(name = "motivo", length = 100)
    private String motivo;

    // La devolución queda aprobada al registrarla (RF10); el aprobador es el usuario que la registra
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = ESTADO_APROBADA;

    @Column(name = "tipo", length = 20)
    private String tipo;

    @Column(name = "montoReembolso")
    private Double montoReembolso;

    @ManyToOne
    @JoinColumn(name = "idProductoCambio")
    @JsonIgnoreProperties({"proveedor"})
    private Producto productoCambio;

    @Column(name = "cantidadCambio")
    private Integer cantidadCambio;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "idVenta", nullable = false)
    @JsonIgnoreProperties({"devoluciones", "detalleVenta"})
    private Venta venta;

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    @JsonIgnoreProperties({"ventas", "solicitudes"})
    private Usuario usuario;

    @OneToMany(mappedBy = "devolucion", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("devolucion")
    private List<DetalleDevolucion> detalleDevolucion;

    // Datos de entrada del frontend (no se guardan tal cual)
    @Transient
    private Map<String, Object> nuevoProducto;

    @Transient
    private Integer idUsuario;

    @Transient
    private Integer idVenta;

    // Id de la venta en la respuesta, sin serializar la venta completa
    public Integer getIdVentaAsociada() {
        return venta != null ? venta.getIdVenta() : null;
    }
}
