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

@Entity
@Table(name = "detalle_devolucion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleDevolucion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDetalleDevolucion")
    private Integer idDetalleDevolucion;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "motivo", length = 100)
    private String motivo;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "idDevolucion", nullable = false)
    private Devolucion devolucion;

    @ManyToOne
    @JoinColumn(name = "idProducto", nullable = false)
    @JsonIgnoreProperties({"proveedor", "detallesVenta", "detallesSolicitud"})
    private Producto producto;
}
