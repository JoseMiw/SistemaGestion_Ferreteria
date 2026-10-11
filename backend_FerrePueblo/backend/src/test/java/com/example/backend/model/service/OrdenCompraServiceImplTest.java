package com.example.backend.model.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.Cotizacion;
import com.example.backend.model.entity.DetalleCotizacion;
import com.example.backend.model.entity.OrdenCompra;
import com.example.backend.model.entity.Producto;
import com.example.backend.model.entity.Proveedor;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.CotizacionRepository;
import com.example.backend.model.repository.OrdenCompraRepository;
import com.example.backend.model.repository.UsuarioRepository;

/** RF05 / CP05: crear orden desde cotización y aprobar solo si está completa y pendiente. */
@ExtendWith(MockitoExtension.class)
class OrdenCompraServiceImplTest {

    private static final Clock RELOJ = Clock.fixed(Instant.parse("2026-09-29T15:00:00Z"), ZoneId.of("America/Lima"));

    @Mock private OrdenCompraRepository ordenCompraRepository;
    @Mock private CotizacionRepository cotizacionRepository;
    @Mock private UsuarioRepository usuarioRepository;

    private OrdenCompraServiceImpl ordenService;
    private Cotizacion cotizacion;

    @BeforeEach
    void preparar() {
        ordenService = new OrdenCompraServiceImpl(ordenCompraRepository, cotizacionRepository, RELOJ, usuarioRepository);

        DetalleCotizacion item = new DetalleCotizacion();
        item.setProducto(new Producto(1));
        item.setCantidad(10);
        item.setPrecioUnitario(5.5);
        item.setSubtotal(55.0);

        cotizacion = new Cotizacion(7);
        cotizacion.setProveedor(new Proveedor(1));
        cotizacion.setFechaCotizacion(LocalDate.of(2026, 9, 29));
        cotizacion.setFechaVigencia(LocalDate.of(2026, 10, 6));
        cotizacion.setMontoTotal(55.0);
        cotizacion.setDetalleCotizacion(List.of(item));

        Usuario gerente = new Usuario(2);
        gerente.setRol("GERENTE");
        lenient().when(usuarioRepository.findById(2)).thenReturn(Optional.of(gerente));
        lenient().when(ordenCompraRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private OrdenCompra ordenPendiente() {
        OrdenCompra orden = new OrdenCompra();
        orden.setIdOrdenCompra(1);
        orden.setCotizacion(cotizacion);
        orden.setProveedor(cotizacion.getProveedor());
        orden.setEstado(OrdenCompra.ESTADO_PENDIENTE);
        return orden;
    }

    @Test
    void creaOrdenPendienteDesdeCotizacionVigente() {
        when(cotizacionRepository.findById(7)).thenReturn(Optional.of(cotizacion));
        OrdenCompra orden = ordenService.crearDesdeCotizacion(7, 2);
        assertEquals(OrdenCompra.ESTADO_PENDIENTE, orden.getEstado());
        assertEquals(55.0, orden.getMontoTotal());
        assertEquals(Cotizacion.ESTADO_ORDENADA, cotizacion.getEstado());
    }

    @Test
    void noCreaOrdenDeCotizacionVencida() {
        cotizacion.setFechaVigencia(LocalDate.of(2026, 9, 28));
        when(cotizacionRepository.findById(7)).thenReturn(Optional.of(cotizacion));
        var ex = assertThrows(ResponseStatusException.class, () -> ordenService.crearDesdeCotizacion(7, 2));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void noCreaDosOrdenesDeLaMismaCotizacion() {
        cotizacion.setEstado(Cotizacion.ESTADO_ORDENADA);
        when(cotizacionRepository.findById(7)).thenReturn(Optional.of(cotizacion));
        var ex = assertThrows(ResponseStatusException.class, () -> ordenService.crearDesdeCotizacion(7, 2));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void aprobarRegistraAprobadorFechaYEstado() {
        when(ordenCompraRepository.findById(1)).thenReturn(Optional.of(ordenPendiente()));
        OrdenCompra aprobada = ordenService.aprobar(1, 2);
        assertEquals(OrdenCompra.ESTADO_APROBADA, aprobada.getEstado());
        assertEquals(2, aprobada.getUsuarioAprobador().getIdUsuario());
        assertNotNull(aprobada.getFechaAprobacion());
    }

    @Test
    void ordenIncompletaNoSeAprueba() {
        OrdenCompra orden = ordenPendiente();
        cotizacion.getDetalleCotizacion().get(0).setPrecioUnitario(0.0);
        when(ordenCompraRepository.findById(1)).thenReturn(Optional.of(orden));
        var ex = assertThrows(ResponseStatusException.class, () -> ordenService.aprobar(1, 2));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals(OrdenCompra.ESTADO_PENDIENTE, orden.getEstado());
    }

    @Test
    void ordenYaAprobadaNoSeVuelveAAprobar() {
        OrdenCompra orden = ordenPendiente();
        orden.setEstado(OrdenCompra.ESTADO_APROBADA);
        when(ordenCompraRepository.findById(1)).thenReturn(Optional.of(orden));
        var ex = assertThrows(ResponseStatusException.class, () -> ordenService.aprobar(1, 2));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }
}
