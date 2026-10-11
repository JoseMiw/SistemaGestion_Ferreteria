package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.entity.Producto;
import com.example.backend.model.service.ProductoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<Producto>> cargar() {
        return ResponseEntity.ok(productoService.cargarProductos());
    }

    // RF01: alertas de stock bajo
    @GetMapping("/stock-bajo")
    public ResponseEntity<List<Producto>> stockBajo() {
        return ResponseEntity.ok(productoService.listarStockBajo());
    }

    // RF03: consulta de stock por código o nombre
    @GetMapping("/consulta")
    public ResponseEntity<List<Producto>> consultarStock(@RequestParam String texto) {
        return ResponseEntity.ok(productoService.consultarStock(texto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> buscarPorId(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                productoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Producto> crear(
            @Valid @RequestBody Producto producto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productoService.crear(producto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Producto producto) {

        return ResponseEntity.ok(
                productoService.actualizar(id, producto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id){
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Producto>> buscarPorNombre(@RequestParam String nombre) {
    return ResponseEntity.ok(productoService.buscarPorNombre(nombre));
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Producto> actualizarStock(@PathVariable Integer id, @RequestParam Integer cantidad) {
        return ResponseEntity.ok(productoService.actualizarStock(id, cantidad));
    }

    @PutMapping("/{id}/aumentar-stock")
    public ResponseEntity<Producto> aumentarStock(@PathVariable Integer id, @RequestParam Integer cantidad) {
        return ResponseEntity.ok(productoService.aumentarStock(id, cantidad));
    }
}
