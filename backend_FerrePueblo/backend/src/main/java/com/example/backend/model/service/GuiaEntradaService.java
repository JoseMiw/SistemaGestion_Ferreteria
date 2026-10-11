package com.example.backend.model.service;

import com.example.backend.model.entity.GuiaEntrada;

public interface GuiaEntradaService {
    GuiaEntrada crear(GuiaEntrada guiaEntrada, Integer idUsuario);
}
