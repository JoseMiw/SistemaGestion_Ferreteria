package com.example.backend.model.entity;



import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "detalle_solicitud_compra")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleSolicitudCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDetalleSolicitudCompra")
    private Integer idDetalleSolicitudCompra;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precioUnitario", nullable = false)
    private Double precioUnitario;

    @Column(nullable = false)
    private Double subtotal;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "idSolicitudCompra", nullable = false)
    @ToString.Exclude
    private SolicitudCompra solicitudCompra;

    @ManyToOne
    @JoinColumn(name = "idProducto", nullable = false)
    @JsonIgnoreProperties({"proveedor", "detallesVenta", "detallesSolicitud"})
    @ToString.Exclude
    private Producto producto;
}
