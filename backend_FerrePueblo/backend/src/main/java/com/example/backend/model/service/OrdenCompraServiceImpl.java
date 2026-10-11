package com.example.backend.model.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.Cotizacion;
import com.example.backend.model.entity.DetalleCotizacion;
import com.example.backend.model.entity.OrdenCompra;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.CotizacionRepository;
import com.example.backend.model.repository.OrdenCompraRepository;

import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdenCompraServiceImpl implements OrdenCompraService {

    private final OrdenCompraRepository ordenCompraRepository;
    private final CotizacionRepository cotizacionRepository;
    private final Clock clock;
    private final UsuarioRepository usuarioRepository;

    @Override
    public List<OrdenCompra> listar() {
        return ordenCompraRepository.findAllByOrderByIdOrdenCompraDesc();
    }

    @Override
    public OrdenCompra buscarPorId(Integer id) {
        return ordenCompraRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden de compra no encontrada con ID: " + id));
    }

    /** RF05: crea la orden desde una cotización registrada y vigente (una orden por cotización). */
    @Override
    @Transactional
    public OrdenCompra crearDesdeCotizacion(Integer idCotizacion, Integer idUsuario) {
        if (idCotizacion == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indique la cotización");
        }
        Cotizacion cotizacion = cotizacionRepository.findById(idCotizacion)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cotización no encontrada con ID: " + idCotizacion));

        if (!Cotizacion.ESTADO_REGISTRADA.equals(cotizacion.getEstado())
                || ordenCompraRepository.existsByCotizacion_IdCotizacion(idCotizacion)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La cotización N° " + idCotizacion + " ya tiene una orden de compra");
        }
        if (cotizacion.getFechaVigencia().isBefore(LocalDate.now(clock))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La cotización venció el " + cotizacion.getFechaVigencia() + "; registre una nueva cotización");
        }
        validarCompleta(cotizacion);

        OrdenCompra orden = new OrdenCompra();
        orden.setCotizacion(cotizacion);
        orden.setProveedor(cotizacion.getProveedor());
        orden.setMontoTotal(cotizacion.getMontoTotal());
        orden.setFechaOrden(LocalDate.now(clock));
        orden.setEstado(OrdenCompra.ESTADO_PENDIENTE);
        orden.setUsuarioCreador(buscarUsuario(idUsuario));

        cotizacion.setEstado(Cotizacion.ESTADO_ORDENADA);
        cotizacionRepository.save(cotizacion);

        return ordenCompraRepository.save(orden);
    }

    /** RF05 / CA09-CA10: solo se aprueba una orden PENDIENTE y completa; guarda aprobador y fecha. */
    @Override
    @Transactional
    public OrdenCompra aprobar(Integer id, Integer idUsuario) {
        OrdenCompra orden = buscarPendiente(id);
        if (orden.getProveedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La orden está incompleta: no tiene proveedor");
        }
        validarCompleta(orden.getCotizacion());

        orden.setEstado(OrdenCompra.ESTADO_APROBADA);
        orden.setUsuarioAprobador(buscarUsuario(idUsuario));
        orden.setFechaAprobacion(LocalDateTime.now(clock));
        return ordenCompraRepository.save(orden);
    }

    @Override
    @Transactional
    public OrdenCompra rechazar(Integer id, Integer idUsuario) {
        OrdenCompra orden = buscarPendiente(id);
        orden.setEstado(OrdenCompra.ESTADO_RECHAZADA);
        orden.setUsuarioAprobador(buscarUsuario(idUsuario));
        orden.setFechaAprobacion(LocalDateTime.now(clock));
        return ordenCompraRepository.save(orden);
    }

    private OrdenCompra buscarPendiente(Integer id) {
        OrdenCompra orden = buscarPorId(id);
        if (!OrdenCompra.ESTADO_PENDIENTE.equals(orden.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La orden N° " + id + " ya fue procesada (estado: " + orden.getEstado() + ")");
        }
        return orden;
    }

    /** Una orden es completa si tiene proveedor y productos con cantidades y precios válidos. */
    static void validarCompleta(Cotizacion cotizacion) {
        if (cotizacion == null || cotizacion.getProveedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La orden está incompleta: no tiene proveedor");
        }
        List<DetalleCotizacion> detalle = cotizacion.getDetalleCotizacion();
        if (detalle == null || detalle.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La orden está incompleta: no tiene productos");
        }
        for (DetalleCotizacion item : detalle) {
            if (item.getProducto() == null
                    || item.getCantidad() == null || item.getCantidad() < 1
                    || item.getPrecioUnitario() == null || item.getPrecioUnitario() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La orden está incompleta: hay productos con cantidad o precio no válidos");
            }
        }
    }

    private Usuario buscarUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario de la sesión no encontrado"));
    }
}
