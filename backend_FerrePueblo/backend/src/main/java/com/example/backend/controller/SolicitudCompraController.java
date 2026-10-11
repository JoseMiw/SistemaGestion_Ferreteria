package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.entity.SolicitudCompra;
import com.example.backend.model.service.SolicitudCompraService;
import com.example.backend.security.UsuarioAutenticado;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudCompraController {
    private final SolicitudCompraService solicitudCompraService;

    @GetMapping
    public ResponseEntity<List<SolicitudCompra>> listar() {
        return ResponseEntity.ok(solicitudCompraService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudCompra> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(solicitudCompraService.buscarPorId(id));
    }

    // El usuario que registra la solicitud se toma del token
    @PostMapping
    public ResponseEntity<SolicitudCompra> crear(@RequestBody SolicitudCompra solicitud,
                                                 @AuthenticationPrincipal UsuarioAutenticado usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(solicitudCompraService.crear(solicitud, usuario.idUsuario()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        solicitudCompraService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
