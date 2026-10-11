package com.example.backend.security;

/**
 * Política de contraseñas (RF09): de 8 a 64 caracteres, al menos una letra y un
 * número, sin espacios, distinta de la actual y del nombre de usuario.
 */
public final class PoliticaContrasena {

    public static final int LONGITUD_MINIMA = 8;
    public static final int LONGITUD_MAXIMA = 64;

    private PoliticaContrasena() {
    }

    /** Devuelve el motivo del rechazo, o null si la contraseña cumple la política. */
    public static String validar(String nueva, String actual, String nombreUsuario) {
        if (nueva == null || nueva.isEmpty()) {
            return "Ingrese la nueva contraseña";
        }
        if (nueva.length() < LONGITUD_MINIMA) {
            return "La nueva contraseña debe tener al menos " + LONGITUD_MINIMA + " caracteres";
        }
        if (nueva.length() > LONGITUD_MAXIMA) {
            return "La nueva contraseña debe tener como máximo " + LONGITUD_MAXIMA + " caracteres";
        }
        if (nueva.chars().anyMatch(Character::isWhitespace)) {
            return "La nueva contraseña no debe contener espacios";
        }
        if (nueva.chars().noneMatch(Character::isLetter)) {
            return "La nueva contraseña debe contener al menos una letra";
        }
        if (nueva.chars().noneMatch(Character::isDigit)) {
            return "La nueva contraseña debe contener al menos un número";
        }
        if (nueva.equals(actual)) {
            return "La nueva contraseña debe ser diferente de la actual";
        }
        if (nombreUsuario != null && nueva.equalsIgnoreCase(nombreUsuario)) {
            return "La nueva contraseña no puede ser igual al nombre de usuario";
        }
        return null;
    }
}
