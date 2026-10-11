package com.example.backend.model.service;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import com.example.backend.model.repository.VentaRepository;
import com.example.backend.util.Montos;
import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VentaServiceImpl implements VentaService{
    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final TipoPagoRepository tipoPagoRepository;
    private final DevolucionRepository devolucionRepository;
    private final Clock clock;
    private final UsuarioRepository usuarioRepository;

    @Override
    public List<Venta> listarVentas() {
        return ventaRepository.findAll();
    }

    @Override
    public Venta buscarPorId(Integer id) {
        return ventaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada con ID: "+id));
    }

    /**
     * RF06 / RNF04: valida existencia y stock, calcula los montos y descuenta
     * el inventario en una sola transacción. Si algo falla, no se guarda nada.
     */
    @Override
    @Transactional
    public Venta crear(Venta venta, Integer idUsuario) {
        if (venta.getDetalleVenta() == null || venta.getDetalleVenta().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe agregar al menos un producto");
        }
        if (venta.getCliente() == null || venta.getCliente().getIdCliente() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cliente es obligatorio");
        }
        Cliente cliente = clienteRepository.findById(venta.getCliente().getIdCliente())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente no registrado"));

        if (venta.getTipoPago() == null || venta.getTipoPago().getIdTipoPago() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de pago es obligatorio");
        }
        TipoPago tipoPago = tipoPagoRepository.findById(venta.getTipoPago().getIdTipoPago())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de pago no válido"));

        // 1. Validar productos, cantidades y stock (acumulando si un producto se repite)
        Map<Integer, Integer> cantidadPorProducto = new HashMap<>();
        double total = 0;
        for (DetalleVenta detalle : venta.getDetalleVenta()) {
            if (detalle.getProducto() == null || detalle.getProducto().getIdProducto() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no indicado en el detalle");
            }
            if (detalle.getCantidad() == null || detalle.getCantidad() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor a 0");
            }
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no encontrado"));

            int solicitado = cantidadPorProducto.merge(producto.getIdProducto(), detalle.getCantidad(), Integer::sum);
            if (solicitado > producto.getStock()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No hay suficiente stock para \"" + producto.getNombre() + "\". Stock disponible: " + producto.getStock());
            }

            // El precio se toma del producto (incluye IGV), no del navegador
            detalle.setProducto(producto);
            detalle.setPrecioUnitario(producto.getPrecioVenta());
            detalle.setSubtotal(Montos.multiplicar(producto.getPrecioVenta(), detalle.getCantidad()));
            detalle.setVenta(venta);
            total += detalle.getSubtotal();
        }

        // 2. Descontar el inventario
        for (Map.Entry<Integer, Integer> item : cantidadPorProducto.entrySet()) {
            Producto producto = productoRepository.findById(item.getKey()).orElseThrow();
            producto.setStock(producto.getStock() - item.getValue());
            productoRepository.save(producto);
        }

        // 3. Montos y datos de cabecera
        total = Montos.redondear(total);
        double subtotal = Montos.baseImponible(total);
        venta.setIdVenta(null);
        venta.setTotal(total);
        venta.setSubtotal(subtotal);
        venta.setIgv(Montos.redondear(total - subtotal));
        venta.setFechaVenta(Date.valueOf(LocalDate.now(clock)));
        venta.setCliente(cliente);
        venta.setTipoPago(tipoPago);
        venta.setUsuario(buscarUsuario(idUsuario));

        return ventaRepository.save(venta);
    }

    /** Elimina la venta y repone su stock. No se permite si tiene devoluciones. */
    @Override
    @Transactional
    public void eliminar(Integer id) {
        Venta venta = buscarPorId(id);

        if (devolucionRepository.existsByVenta_IdVenta(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar una venta que tiene devoluciones registradas");
        }

        if (venta.getDetalleVenta() != null) {
            for (DetalleVenta detalle : venta.getDetalleVenta()) {
                Producto producto = detalle.getProducto();
                producto.setStock(producto.getStock() + detalle.getCantidad());
                productoRepository.save(producto);
            }
        }

        ventaRepository.delete(venta);
    }

    private Usuario buscarUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario de la sesión no encontrado"));
    }
}
