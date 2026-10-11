package com.example.backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.entity.DetalleDevolucion;

public interface DetalleDevolucionRepository extends JpaRepository<DetalleDevolucion, Integer>{

    // Unidades de un producto que ya fueron devueltas en devoluciones anteriores de la misma venta
    @Query("SELECT COALESCE(SUM(d.cantidad), 0) FROM DetalleDevolucion d " +
           "WHERE d.devolucion.venta.idVenta = :idVenta AND d.producto.idProducto = :idProducto")
    Long sumarCantidadDevuelta(@Param("idVenta") Integer idVenta, @Param("idProducto") Integer idProducto);
}
