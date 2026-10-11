package com.example.backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.Proveedor;

public interface ProveedorRepository extends JpaRepository<Proveedor,Integer>{
    Proveedor findByRuc(String ruc);
}
