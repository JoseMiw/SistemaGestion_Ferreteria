package com.example.backend.model.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Date;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.DetalleDevolucion;
import com.example.backend.model.entity.DetalleVenta;
import com.example.backend.model.entity.Devolucion;
import com.example.backend.model.entity.Producto;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.entity.Venta;
import com.example.backend.model.repository.DetalleDevolucionRepository;
import com.example.backend.model.repository.DevolucionRepository;
import com.example.backend.model.repository.ProductoRepository;
import com.example.backend.model.repository.UsuarioRepository;
import com.example.backend.model.repository.VentaRepository;

/** RF10 / CP10: devolver parte y total; rechazar exceso y venta inexistente. */
@ExtendWith(MockitoExtension.class)
class DevolucionServiceImplTest {

    @Mock private DevolucionRepository devolucionRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private VentaRepository ventaRepository;
    @Mock private DetalleDevolucionRepository detalleDevolucionRepository;
    @Mock private UsuarioRepository usuarioRepository;

    private DevolucionServiceImpl devolucionService;
    private Producto taladro;
    private Venta venta;

    @BeforeEach
    void preparar() {
        Clock reloj = Clock.fixed(Instant.parse("2026-09-29T15:00:00Z"), ZoneId.of("America/Lima"));
        devolucionService = new DevolucionServiceImpl(devolucionRepository, productoRepository, ventaRepository,
                detalleDevolucionRepository, reloj, usuarioRepository);

        taladro = new Producto(1);
        taladro.setNombre("Taladro");
        taladro.setStock(5);

        DetalleVenta vendido = new DetalleVenta();
        vendido.setProducto(taladro);
        vendido.setCantidad(3);
        vendido.setPrecioUnitario(12.5);

        venta = new Venta(10);
        venta.setFechaVenta(Date.valueOf(LocalDate.of(2026, 9, 28)));
        venta.setDetalleVenta(List.of(vendido));

        lenient().when(ventaRepository.findById(10)).thenReturn(Optional.of(venta));
        lenient().when(productoRepository.findById(1)).thenReturn(Optional.of(taladro));
        lenient().when(usuarioRepository.findById(3)).thenReturn(Optional.of(new Usuario(3)));
        lenient().when(detalleDevolucionRepository.sumarCantidadDevuelta(eq(10), eq(1))).thenReturn(0L);
        lenient().when(devolucionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private Devolucion devolucion(int idVenta, int cantidad) {
        DetalleDevolucion detalle = new DetalleDevolucion();
        detalle.setProducto(new Producto(1));
        detalle.setCantidad(cantidad);

        Devolucion devolucion = new Devolucion();
        devolucion.setVenta(new Venta(idVenta));
        devolucion.setMotivo("Falla de fábrica");
        devolucion.setDetalleDevolucion(List.of(detalle));
        return devolucion;
    }

    @Test
    void devolucionParcialReponeStockYQuedaAprobadaComoReembolso() {
        Devolucion guardada = devolucionService.crear(devolucion(10, 2), 3);
        assertEquals(7, taladro.getStock());
        assertEquals(Devolucion.ESTADO_APROBADA, guardada.getEstado());
        assertEquals(Devolucion.TIPO_REEMBOLSO, guardada.getTipo());
        assertEquals(25.0, guardada.getMontoReembolso());
        assertEquals(10, guardada.getIdVentaAsociada());
    }

    @Test
    void devolucionTotalDeLoVendido() {
        devolucionService.crear(devolucion(10, 3), 3);
        assertEquals(8, taladro.getStock());
    }

    @Test
    void cantidadMayorALaVendidaSeRechazaSinTocarElStock() {
        var ex = assertThrows(ResponseStatusException.class, () -> devolucionService.crear(devolucion(10, 4), 3));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals(5, taladro.getStock());
        verify(devolucionRepository, never()).save(any());
    }

    @Test
    void consideraLoYaDevueltoEnDevolucionesAnteriores() {
        when(detalleDevolucionRepository.sumarCantidadDevuelta(10, 1)).thenReturn(2L);
        assertThrows(ResponseStatusException.class, () -> devolucionService.crear(devolucion(10, 2), 3));
        assertEquals(5, taladro.getStock());
    }

    @Test
    void ventaInexistenteDevuelve404() {
        when(ventaRepository.findById(99)).thenReturn(Optional.empty());
        var ex = assertThrows(ResponseStatusException.class, () -> devolucionService.crear(devolucion(99, 1), 3));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void fueraDelPlazoDeTresDiasSeRechaza() {
        venta.setFechaVenta(Date.valueOf(LocalDate.of(2026, 9, 25)));
        assertThrows(ResponseStatusException.class, () -> devolucionService.crear(devolucion(10, 1), 3));
        assertEquals(5, taladro.getStock());
    }

    @Test
    void cambioDescuentaElProductoNuevoYSinStockSeRechaza() {
        Producto martillo = new Producto(2);
        martillo.setStock(1);
        when(productoRepository.findById(2)).thenReturn(Optional.of(martillo));

        Devolucion cambio = devolucion(10, 1);
        cambio.setNuevoProducto(Map.of("idProducto", 2, "cantidad", 1));
        Devolucion guardada = devolucionService.crear(cambio, 3);
        assertEquals(Devolucion.TIPO_CAMBIO, guardada.getTipo());
        assertEquals(0, martillo.getStock());

        Devolucion otroCambio = devolucion(10, 1);
        otroCambio.setNuevoProducto(Map.of("idProducto", 2, "cantidad", 1));
        assertThrows(ResponseStatusException.class, () -> devolucionService.crear(otroCambio, 3));
    }
}
