package com.example.backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.Venta;

public interface VentaRepository extends JpaRepository<Venta,Integer>{
    boolean existsByCliente_IdCliente(Integer idCliente);
}
