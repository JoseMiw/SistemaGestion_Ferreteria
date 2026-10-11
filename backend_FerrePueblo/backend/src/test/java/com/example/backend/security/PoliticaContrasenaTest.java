package com.example.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** RF09 / CP09: política de contraseñas (válidos, límites e inválidos). */
class PoliticaContrasenaTest {

    @Test
    @DisplayName("Contraseña válida: 8 caracteres con letras y números")
    void aceptaContrasenaValidaEnElLimiteInferior() {
        assertNull(PoliticaContrasena.validar("abcdef12", "123", "Vendedor"));
    }

    @Test
    @DisplayName("Límite: 7 caracteres se rechaza")
    void rechazaSieteCaracteres() {
        String error = PoliticaContrasena.validar("abcde12", "123", "Vendedor");
        assertNotNull(error);
        assertTrue(error.contains("8 caracteres"));
    }

    @Test
    @DisplayName("Límite: 64 caracteres se acepta y 65 se rechaza")
    void limiteSuperior() {
        String sesentaYCuatro = "a1".repeat(32);
        assertNull(PoliticaContrasena.validar(sesentaYCuatro, "123", "Vendedor"));
        assertNotNull(PoliticaContrasena.validar(sesentaYCuatro + "b", "123", "Vendedor"));
    }

    @ParameterizedTest(name = "Rechaza \"{0}\"")
    @ValueSource(strings = {"solamenteletras", "1234567890", "con espacio1", ""})
    void rechazaContrasenasQueNoCumplen(String nueva) {
        assertNotNull(PoliticaContrasena.validar(nueva, "123", "Vendedor"));
    }

    @Test
    void rechazaIgualALaActual() {
        assertEquals("La nueva contraseña debe ser diferente de la actual",
                PoliticaContrasena.validar("Segura2026", "Segura2026", "Vendedor"));
    }

    @Test
    void rechazaIgualAlNombreDeUsuario() {
        assertNotNull(PoliticaContrasena.validar("vendedor1", "123", "Vendedor1"));
    }

    @Test
    void rechazaNula() {
        assertNotNull(PoliticaContrasena.validar(null, "123", "Vendedor"));
    }
}
