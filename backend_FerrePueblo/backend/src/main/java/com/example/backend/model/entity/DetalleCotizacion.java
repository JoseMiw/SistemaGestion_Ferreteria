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
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "detalle_cotizacion")
@Data
@NoArgsConstructor
public class DetalleCotizacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDetalleCotizacion")
    private Integer idDetalleCotizacion;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precioUnitario", nullable = false)
    private Double precioUnitario;

    @Column(nullable = false)
    private Double subtotal;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "idCotizacion", nullable = false)
    @ToString.Exclude
    private Cotizacion cotizacion;

    @ManyToOne
    @JoinColumn(name = "idProducto", nullable = false)
    @JsonIgnoreProperties({"proveedor"})
    @ToString.Exclude
    private Producto producto;
}
