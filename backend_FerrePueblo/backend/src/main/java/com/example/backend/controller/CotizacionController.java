package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.entity.Cotizacion;
import com.example.backend.model.service.CotizacionService;
import com.example.backend.security.UsuarioAutenticado;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cotizaciones")
@RequiredArgsConstructor
public class CotizacionController {
    private final CotizacionService cotizacionService;

    @GetMapping
    public ResponseEntity<List<Cotizacion>> listar() {
        return ResponseEntity.ok(cotizacionService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cotizacion> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(cotizacionService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Cotizacion> crear(@RequestBody Cotizacion cotizacion,
                                            @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cotizacionService.crear(cotizacion, usuario.idUsuario()));
    }
}
