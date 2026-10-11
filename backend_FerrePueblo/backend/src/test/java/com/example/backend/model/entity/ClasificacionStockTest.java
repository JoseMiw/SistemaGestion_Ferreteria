package com.example.backend.model.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** RF01 / RF03 / CP01: clasificación del stock por debajo, igual y encima del mínimo. */
class ClasificacionStockTest {

    @ParameterizedTest(name = "stock={0}, mínimo={1} -> {2}")
    @CsvSource({
        "0,   5, AGOTADO",
        "-1,  5, AGOTADO",
        "1,   5, BAJO",
        "4,   5, BAJO",
        "5,   5, BAJO",      // igual al mínimo: debe aparecer en alertas
        "6,   5, NORMAL",    // encima del mínimo: no aparece
        "100, 5, NORMAL",
        "1,   0, NORMAL",
        "0,   0, AGOTADO"
    })
    void clasifica(int stock, int minimo, String esperado) {
        assertEquals(esperado, Producto.clasificarStock(stock, minimo));
    }

    @ParameterizedTest(name = "stock={0}, mínimo={1} (con nulos) -> {2}")
    @CsvSource(value = {"NULL, 5, AGOTADO", "3, NULL, NORMAL"}, nullValues = "NULL")
    void toleraNulos(Integer stock, Integer minimo, String esperado) {
        assertEquals(esperado, Producto.clasificarStock(stock, minimo));
    }
}
