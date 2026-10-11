package com.example.backend.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "guia_entrada")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GuiaEntrada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idGuiaEntrada")
    private Integer idGuiaEntrada;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "costoUnitario", nullable = false)
    private Double costoUnitario;

    @Column(name = "subtotal", nullable = false)
    private Double subtotal;

    @Column(name = "fechaEntrada")
    private LocalDate fechaEntrada;

    @ManyToOne
    @JoinColumn(name = "idProveedor", nullable = false)
    @JsonIgnoreProperties({"productos", "solicitudes"})
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "idUsuario", nullable = false)
    @JsonIgnoreProperties({"ventas", "solicitudes"})
    private Usuario usuario;

    // Solo en guías antiguas (antes de las órdenes de compra)
    @ManyToOne
    @JoinColumn(name = "idSolicitudCompra")
    @JsonIgnoreProperties({"detalleSolicitud", "proveedor", "usuario"})
    private SolicitudCompra solicitudCompra;

    @ManyToOne
    @JoinColumn(name = "idOrdenCompra")
    @JsonIgnoreProperties({"cotizacion", "proveedor", "usuarioCreador", "usuarioAprobador"})
    private OrdenCompra ordenCompra;

    @OneToMany(mappedBy = "guiaEntrada", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("guiaEntrada")
    private List<DetalleGuiaEntrada> detalleGuia;

    // Dato de entrada: número de la orden de compra que se recibe
    @Transient
    private Integer idOrdenCompra;
}
