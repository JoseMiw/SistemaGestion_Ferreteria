package com.example.backend.model.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.DetalleCotizacion;
import com.example.backend.model.entity.DetalleGuiaEntrada;
import com.example.backend.model.entity.GuiaEntrada;
import com.example.backend.model.entity.OrdenCompra;
import com.example.backend.model.entity.Producto;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.GuiaEntradaRepository;
import com.example.backend.model.repository.OrdenCompraRepository;
import com.example.backend.model.repository.ProductoRepository;
import com.example.backend.util.Montos;
import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GuiaEntradaServiceImpl implements GuiaEntradaService {

    private final GuiaEntradaRepository guiaEntradaRepository;
    private final OrdenCompraRepository ordenCompraRepository;
    private final ProductoRepository productoRepository;
    private final Clock clock;
    private final UsuarioRepository usuarioRepository;

    /**
     * Registra la mercadería recibida de una orden de compra APROBADA (una sola vez),
     * aumenta el stock y marca la orden como ENTREGADA, todo en una transacción (RNF04).
     */
    @Override
    @Transactional
    public GuiaEntrada crear(GuiaEntrada guiaEntrada, Integer idUsuario) {
        if (guiaEntrada.getIdOrdenCompra() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indique la orden de compra");
        }
        OrdenCompra orden = ordenCompraRepository.findById(guiaEntrada.getIdOrdenCompra())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Orden de compra no encontrada con ID: " + guiaEntrada.getIdOrdenCompra()));

        if (OrdenCompra.ESTADO_ENTREGADA.equals(orden.getEstado())
                || guiaEntradaRepository.existsByOrdenCompra_IdOrdenCompra(orden.getIdOrdenCompra())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La orden N° " + orden.getIdOrdenCompra() + " ya fue entregada");
        }
        if (!OrdenCompra.ESTADO_APROBADA.equals(orden.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La orden N° " + orden.getIdOrdenCompra() + " no está aprobada (estado: " + orden.getEstado() + ")");
        }

        if (guiaEntrada.getDetalleGuia() == null || guiaEntrada.getDetalleGuia().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay productos para entregar");
        }

        // Cantidades y precios pedidos en la orden (vienen de su cotización)
        Map<Integer, DetalleCotizacion> pedido = new HashMap<>();
        for (DetalleCotizacion item : orden.getCotizacion().getDetalleCotizacion()) {
            pedido.put(item.getProducto().getIdProducto(), item);
        }

        Set<Integer> productosVistos = new HashSet<>();
        int cantidadTotal = 0;
        double subtotalTotal = 0;
        for (DetalleGuiaEntrada detalle : guiaEntrada.getDetalleGuia()) {
            if (detalle.getProducto() == null || detalle.getProducto().getIdProducto() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no indicado en el detalle");
            }
            Integer idProducto = detalle.getProducto().getIdProducto();
            DetalleCotizacion itemPedido = pedido.get(idProducto);
            if (itemPedido == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto no pertenece a la orden de compra");
            }
            if (!productosVistos.add(idProducto)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un producto no puede repetirse en la entrega");
            }
            Producto producto = itemPedido.getProducto();
            if (detalle.getCantidad() == null || detalle.getCantidad() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La cantidad recibida de \"" + producto.getNombre() + "\" debe ser mayor a 0");
            }
            if (detalle.getCantidad() > itemPedido.getCantidad()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La cantidad recibida de \"" + producto.getNombre() + "\" no puede ser mayor a la pedida (" + itemPedido.getCantidad() + ")");
            }

            double costo = detalle.getCostoUnitario() != null && detalle.getCostoUnitario() > 0
                ? detalle.getCostoUnitario() : itemPedido.getPrecioUnitario();
            detalle.setProducto(producto);
            detalle.setCostoUnitario(costo);
            detalle.setSubtotal(Montos.multiplicar(costo, detalle.getCantidad()));
            detalle.setGuiaEntrada(guiaEntrada);

            // Aumentar stock
            producto.setStock(producto.getStock() + detalle.getCantidad());
            productoRepository.save(producto);

            cantidadTotal += detalle.getCantidad();
            subtotalTotal += detalle.getSubtotal();
        }

        guiaEntrada.setIdGuiaEntrada(null);
        guiaEntrada.setCantidad(cantidadTotal);
        guiaEntrada.setSubtotal(Montos.redondear(subtotalTotal));
        guiaEntrada.setCostoUnitario(Montos.redondear(subtotalTotal / cantidadTotal));
        guiaEntrada.setFechaEntrada(LocalDate.now(clock));
        guiaEntrada.setOrdenCompra(orden);
        guiaEntrada.setProveedor(orden.getProveedor());
        guiaEntrada.setSolicitudCompra(orden.getCotizacion().getSolicitudCompra());
        guiaEntrada.setUsuario(buscarUsuario(idUsuario));

        orden.setEstado(OrdenCompra.ESTADO_ENTREGADA);
        ordenCompraRepository.save(orden);

        return guiaEntradaRepository.save(guiaEntrada);
    }

    private Usuario buscarUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario de la sesión no encontrado"));
    }
}
