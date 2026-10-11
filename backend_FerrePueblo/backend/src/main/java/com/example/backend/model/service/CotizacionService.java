package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.Cotizacion;

public interface CotizacionService {
    List<Cotizacion> listar();
    Cotizacion buscarPorId(Integer id);
    Cotizacion crear(Cotizacion cotizacion, Integer idUsuario);
}
