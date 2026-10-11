package com.example.backend.security;

/** Usuario que hizo la petición, obtenido del token JWT. */
public record UsuarioAutenticado(Integer idUsuario, String nombreUsuario, String rol) {
}
