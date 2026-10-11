package com.example.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Ingrese el usuario") String nombreUsuario,
        @NotBlank(message = "Ingrese la contraseña") String contraseña) {
}
