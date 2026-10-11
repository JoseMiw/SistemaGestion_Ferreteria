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
@Table(name = "detalle_guia_entrada")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleGuiaEntrada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDetalleGuiaEntrada")
    private Integer idDetalleGuiaEntrada;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "costoUnitario", nullable = false)
    private Double costoUnitario;

    @Column(nullable = false)
    private Double subtotal;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "idGuiaEntrada", nullable = false)
    private GuiaEntrada guiaEntrada;

    @ManyToOne
    @JoinColumn(name = "idProducto", nullable = false)
    @JsonIgnoreProperties({"detallesVenta", "detallesSolicitud", "proveedor"})
    private Producto producto;
}
