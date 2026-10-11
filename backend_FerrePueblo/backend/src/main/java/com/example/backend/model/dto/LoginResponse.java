package com.example.backend.model.dto;

import com.example.backend.model.entity.Usuario;

/** Token JWT y datos del usuario (sin contraseña). */
public record LoginResponse(String token, Usuario usuario) {
}
