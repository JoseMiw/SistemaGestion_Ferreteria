package com.example.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.model.entity.Devolucion;
import com.example.backend.model.entity.Venta;
import com.example.backend.model.service.DevolucionService;
import com.example.backend.security.UsuarioAutenticado;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/devoluciones")
@RequiredArgsConstructor
public class DevolucionController {
    private final DevolucionService devolucionService;

    @PostMapping
    public ResponseEntity<Devolucion> crear(@RequestBody Devolucion devolucion,
                                            @AuthenticationPrincipal UsuarioAutenticado usuario) {
        // El frontend envía idVenta directamente
        if (devolucion.getVenta() == null && devolucion.getIdVenta() != null) {
            devolucion.setVenta(new Venta(devolucion.getIdVenta()));
        }

        // El usuario que registra (y aprueba) la devolución se toma del token
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(devolucionService.crear(devolucion, usuario.idUsuario()));
    }
}
