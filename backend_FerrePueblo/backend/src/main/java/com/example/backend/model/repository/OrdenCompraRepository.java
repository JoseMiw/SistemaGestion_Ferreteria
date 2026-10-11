package com.example.backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.OrdenCompra;

public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, Integer> {
    List<OrdenCompra> findAllByOrderByIdOrdenCompraDesc();

    boolean existsByCotizacion_IdCotizacion(Integer idCotizacion);
}
