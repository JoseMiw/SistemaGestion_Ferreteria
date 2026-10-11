package com.example.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.entity.GuiaEntrada;
import com.example.backend.model.service.GuiaEntradaService;
import com.example.backend.security.UsuarioAutenticado;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/entregas")
@RequiredArgsConstructor
public class GuiaEntradaController {
    private final GuiaEntradaService guiaEntradaService;

    // Body: { "idOrdenCompra": 1, "detalleGuia": [ { "producto": {"idProducto": 1}, "cantidad": 5, "costoUnitario": 10.0 } ] }
    @PostMapping
    public ResponseEntity<GuiaEntrada> crear(@RequestBody GuiaEntrada guiaEntrada,
                                             @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(guiaEntradaService.crear(guiaEntrada, usuario.idUsuario()));
    }
}
