package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.SolicitudCompra;

public interface SolicitudCompraService {
    List<SolicitudCompra> listar();
    SolicitudCompra buscarPorId(Integer id);
    SolicitudCompra crear(SolicitudCompra solicitud, Integer idUsuario);
    void eliminar(Integer id);
}
