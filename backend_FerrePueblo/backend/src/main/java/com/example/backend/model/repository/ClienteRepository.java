package com.example.backend.model.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.model.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente,Integer>{
    Optional<Cliente> findByDni(String dni);

    boolean existsByDni(String dni);

    boolean existsByDniAndIdClienteNot(String dni, Integer idCliente);
}
