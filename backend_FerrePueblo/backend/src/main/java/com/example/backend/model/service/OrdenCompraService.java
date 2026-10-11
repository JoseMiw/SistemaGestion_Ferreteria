package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.OrdenCompra;

public interface OrdenCompraService {
    List<OrdenCompra> listar();
    OrdenCompra buscarPorId(Integer id);
    OrdenCompra crearDesdeCotizacion(Integer idCotizacion, Integer idUsuario);
    OrdenCompra aprobar(Integer id, Integer idUsuario);
    OrdenCompra rechazar(Integer id, Integer idUsuario);
}
