package com.example.backend.model.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.Cliente;
import com.example.backend.model.entity.DetalleVenta;
import com.example.backend.model.entity.Producto;
import com.example.backend.model.entity.TipoPago;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.entity.Venta;
import com.example.backend.model.repository.ClienteRepository;
import com.example.backend.model.repository.DevolucionRepository;
import com.example.backend.model.repository.ProductoRepository;
import com.example.backend.model.repository.TipoPagoRepository;
import com.example.backend.model.repository.UsuarioRepository;
import com.example.backend.model.repository.VentaRepository;

/** RF06 / CP06: vender cantidad menor, igual y mayor al stock. */
@ExtendWith(MockitoExtension.class)
class VentaServiceImplTest {

    @Mock private VentaRepository ventaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private TipoPagoRepository tipoPagoRepository;
    @Mock private DevolucionRepository devolucionRepository;
    @Mock private UsuarioRepository usuarioRepository;

    private VentaServiceImpl ventaService;
    private Producto martillo;

    @BeforeEach
    void preparar() {
        Clock reloj = Clock.fixed(Instant.parse("2026-09-29T15:00:00Z"), ZoneId.of("America/Lima"));
        ventaService = new VentaServiceImpl(ventaRepository, productoRepository, clienteRepository,
                tipoPagoRepository, devolucionRepository, reloj, usuarioRepository);

        martillo = new Producto(2);
        martillo.setNombre("Martillo");
        martillo.setStock(10);
        martillo.setPrecioVenta(10.0);

        lenient().when(clienteRepository.findById(1)).thenReturn(Optional.of(new Cliente()));
        lenient().when(tipoPagoRepository.findById(1)).thenReturn(Optional.of(new TipoPago()));
        lenient().when(productoRepository.findById(2)).thenReturn(Optional.of(martillo));
        lenient().when(usuarioRepository.findById(3)).thenReturn(Optional.of(new Usuario(3)));
        lenient().when(ventaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private Venta venta(int cantidad) {
        DetalleVenta detalle = new DetalleVenta();
        detalle.setProducto(new Producto(2));
        detalle.setCantidad(cantidad);
        detalle.setPrecioUnitario(0.01); // el backend ignora el precio enviado por el navegador

        Venta venta = new Venta();
        Cliente cliente = new Cliente();
        cliente.setIdCliente(1);
        venta.setCliente(cliente);
        TipoPago tipoPago = new TipoPago();
        tipoPago.setIdTipoPago(1);
        venta.setTipoPago(tipoPago);
        venta.setDetalleVenta(new ArrayList<>(List.of(detalle)));
        return venta;
    }

    @Test
    void cantidadMenorAlStockDescuentaExactamenteYCalculaTotales() {
        Venta guardada = ventaService.crear(venta(3), 3);
        assertEquals(7, martillo.getStock());
        assertEquals(30.0, guardada.getTotal());
        assertEquals(25.42, guardada.getSubtotal());
        assertEquals(4.58, guardada.getIgv());
        assertEquals(10.0, guardada.getDetalleVenta().get(0).getPrecioUnitario());
        assertEquals("2026-09-29", guardada.getFechaVenta().toString());
    }

    @Test
    void cantidadIgualAlStockDejaElStockEnCero() {
        ventaService.crear(venta(10), 3);
        assertEquals(0, martillo.getStock());
    }

    @Test
    void cantidadMayorAlStockNoGuardaNiCambiaElStock() {
        var ex = assertThrows(ResponseStatusException.class, () -> ventaService.crear(venta(11), 3));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertEquals(10, martillo.getStock());
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void cantidadCeroSeRechaza() {
        assertThrows(ResponseStatusException.class, () -> ventaService.crear(venta(0), 3));
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void mismoProductoRepetidoSeAcumulaAlValidarStock() {
        Venta venta = venta(6);
        DetalleVenta otraLinea = new DetalleVenta();
        otraLinea.setProducto(new Producto(2));
        otraLinea.setCantidad(5);
        venta.getDetalleVenta().add(otraLinea);

        assertThrows(ResponseStatusException.class, () -> ventaService.crear(venta, 3));
        assertEquals(10, martillo.getStock());
    }

    @Test
    void clienteInexistenteSeRechaza() {
        Venta venta = venta(1);
        venta.getCliente().setIdCliente(99);
        when(clienteRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> ventaService.crear(venta, 3));
        assertEquals(10, martillo.getStock());
    }
}
