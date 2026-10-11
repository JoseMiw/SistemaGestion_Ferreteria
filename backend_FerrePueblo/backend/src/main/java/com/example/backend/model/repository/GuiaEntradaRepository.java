package com.example.backend.model.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.GuiaEntrada;

public interface GuiaEntradaRepository extends JpaRepository<GuiaEntrada,Integer>{
    boolean existsBySolicitudCompra_IdSolicitudCompra(Integer idSolicitudCompra);

    boolean existsByOrdenCompra_IdOrdenCompra(Integer idOrdenCompra);
}
