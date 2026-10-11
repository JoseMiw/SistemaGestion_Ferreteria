package com.example.backend.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Cálculos de montos con redondeo a 2 decimales. */
public final class Montos {

    /** IGV de Perú: los precios de venta ya lo incluyen. */
    public static final double FACTOR_IGV = 1.18;

    private Montos() {
    }

    public static double redondear(double valor) {
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    public static double multiplicar(double precio, int cantidad) {
        return BigDecimal.valueOf(precio).multiply(BigDecimal.valueOf(cantidad))
                .setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    /** Valor de venta sin IGV a partir de un total que lo incluye. */
    public static double baseImponible(double totalConIgv) {
        return BigDecimal.valueOf(totalConIgv).divide(BigDecimal.valueOf(FACTOR_IGV), 2, RoundingMode.HALF_UP).doubleValue();
    }
}
