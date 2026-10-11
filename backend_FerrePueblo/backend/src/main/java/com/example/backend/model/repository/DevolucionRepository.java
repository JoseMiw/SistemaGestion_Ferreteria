package com.example.backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.Devolucion;

public interface DevolucionRepository extends JpaRepository<Devolucion, Integer>{
    boolean existsByVenta_IdVenta(Integer idVenta);
}
