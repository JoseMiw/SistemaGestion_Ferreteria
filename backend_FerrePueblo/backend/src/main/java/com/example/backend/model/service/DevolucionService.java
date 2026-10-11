package com.example.backend.model.service;

import com.example.backend.model.entity.Devolucion;

public interface DevolucionService {
    Devolucion crear(Devolucion devolucion, Integer idUsuario);
}
