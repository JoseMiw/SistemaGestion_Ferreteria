package com.example.backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.Cotizacion;

public interface CotizacionRepository extends JpaRepository<Cotizacion, Integer> {
    List<Cotizacion> findAllByOrderByIdCotizacionDesc();

    boolean existsBySolicitudCompra_IdSolicitudCompra(Integer idSolicitudCompra);
}
