package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.Venta;

public interface VentaService {
    public List<Venta> listarVentas();
    public Venta buscarPorId(Integer id);
    public Venta crear(Venta venta, Integer idUsuario);
    public void eliminar(Integer id);
}
