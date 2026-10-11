package com.example.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

/** Cálculo de totales e IGV (el precio de venta ya incluye IGV). */
class MontosTest {

    @Test
    void multiplicaYRedondeaADosDecimales() {
        assertEquals(20.0, Montos.multiplicar(10.0, 2));
        assertEquals(0.3, Montos.multiplicar(0.1, 3));      // sin error de coma flotante
        assertEquals(33.33, Montos.multiplicar(11.11, 3));
    }

    @Test
    void separaBaseImponibleEIgv() {
        double total = 118.0;
        double base = Montos.baseImponible(total);
        assertEquals(100.0, base);
        assertEquals(18.0, Montos.redondear(total - base));
    }

    @Test
    void baseImponibleDeVentaDePrueba() {
        // 2 x S/ 10.00 = 20.00 -> base 16.95 + IGV 3.05
        double base = Montos.baseImponible(20.0);
        assertEquals(16.95, base);
        assertEquals(3.05, Montos.redondear(20.0 - base));
    }

    @Test
    void redondeoHaciaArribaEnLaMitad() {
        assertEquals(2.35, Montos.redondear(2.345));
    }
}
