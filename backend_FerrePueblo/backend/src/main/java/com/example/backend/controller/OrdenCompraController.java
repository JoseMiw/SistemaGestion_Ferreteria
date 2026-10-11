package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.entity.OrdenCompra;
import com.example.backend.model.service.OrdenCompraService;
import com.example.backend.security.UsuarioAutenticado;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ordenes")
@RequiredArgsConstructor
public class OrdenCompraController {
    private final OrdenCompraService ordenCompraService;

    @GetMapping
    public ResponseEntity<List<OrdenCompra>> listar() {
        return ResponseEntity.ok(ordenCompraService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdenCompra> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(ordenCompraService.buscarPorId(id));
    }

    // Body: { "idCotizacion": 1 }
    @PostMapping
    public ResponseEntity<OrdenCompra> crear(@RequestBody Map<String, Integer> body,
                                             @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ordenCompraService.crearDesdeCotizacion(body.get("idCotizacion"), usuario.idUsuario()));
    }

    // Solo el rol GERENTE (ver SecurityConfig)
    @PutMapping("/{id}/aprobar")
    public ResponseEntity<OrdenCompra> aprobar(@PathVariable Integer id,
                                               @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ResponseEntity.ok(ordenCompraService.aprobar(id, usuario.idUsuario()));
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<OrdenCompra> rechazar(@PathVariable Integer id,
                                                @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ResponseEntity.ok(ordenCompraService.rechazar(id, usuario.idUsuario()));
    }
}
