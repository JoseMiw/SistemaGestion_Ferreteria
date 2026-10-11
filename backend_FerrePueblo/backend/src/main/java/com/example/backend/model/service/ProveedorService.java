package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.Proveedor;

public interface ProveedorService {
    List<Proveedor> listar();
    Proveedor buscarPorId(Integer id);
    Proveedor buscarPorRuc(String ruc);
    Proveedor crear(Proveedor proveedor);
    Proveedor actualizar(Proveedor proveedor);
    void eliminar(Integer id);
}
