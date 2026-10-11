package com.example.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record CambioPasswordRequest(
        @NotBlank(message = "Ingrese el usuario") String nombreUsuario,
        @NotBlank(message = "Ingrese la contraseña actual") String contraseñaActual,
        @NotBlank(message = "Ingrese la nueva contraseña") String contraseñaNueva) {
}
