package com.example.backend.model.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import com.example.backend.model.repository.VentaRepository;
import com.example.backend.util.Montos;
import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DevolucionServiceImpl implements DevolucionService{
    /** Plazo máximo para devolver, contado desde la fecha de la venta. */
    static final int DIAS_MAXIMOS_DEVOLUCION = 3;

    private final DevolucionRepository devolucionRepository;
    private final ProductoRepository productoRepository;
    private final VentaRepository ventaRepository;
    private final DetalleDevolucionRepository detalleDevolucionRepository;
    private final Clock clock;
    private final UsuarioRepository usuarioRepository;

    /**
     * RF10 / RNF04: la devolución queda ligada a la venta, no acepta más de lo
     * vendido y se aprueba al registrarla, reponiendo el stock en la misma transacción.
     */
    @Override
    @Transactional
    public Devolucion crear(Devolucion devolucion, Integer idUsuario) {
        // 1. Validar la venta
        if (devolucion.getVenta() == null || devolucion.getVenta().getIdVenta() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La venta es obligatoria");
        }
        Venta venta = ventaRepository.findById(devolucion.getVenta().getIdVenta())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));
        devolucion.setVenta(venta);

        LocalDate hoy = LocalDate.now(clock);
        LocalDate fechaVenta = venta.getFechaVenta().toLocalDate();
        if (ChronoUnit.DAYS.between(fechaVenta, hoy) > DIAS_MAXIMOS_DEVOLUCION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Han pasado más de " + DIAS_MAXIMOS_DEVOLUCION + " días desde la venta. No se puede realizar la devolución.");
        }

        if (devolucion.getMotivo() == null || devolucion.getMotivo().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrese el motivo de la devolución");
        }

        if (devolucion.getDetalleDevolucion() == null || devolucion.getDetalleDevolucion().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar al menos un producto a devolver");
        }

        // 2. AUMENTAR STOCK de productos devueltos (validando que no se devuelva más de lo vendido)
        double montoDevuelto = 0;
        for (DetalleDevolucion detalle : devolucion.getDetalleDevolucion()) {
            if (detalle.getProducto() == null || detalle.getProducto().getIdProducto() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto devuelto no indicado");
            }
            if (detalle.getCantidad() == null || detalle.getCantidad() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad a devolver debe ser mayor a 0");
            }

            Integer idProducto = detalle.getProducto().getIdProducto();
            DetalleVenta vendido = venta.getDetalleVenta().stream()
                .filter(dv -> dv.getProducto().getIdProducto().equals(idProducto))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El producto no pertenece a la venta"));
            int cantidadVendida = venta.getDetalleVenta().stream()
                .filter(dv -> dv.getProducto().getIdProducto().equals(idProducto))
                .mapToInt(DetalleVenta::getCantidad)
                .sum();

            long yaDevuelto = detalleDevolucionRepository.sumarCantidadDevuelta(venta.getIdVenta(), idProducto);
            long disponible = cantidadVendida - yaDevuelto;
            if (detalle.getCantidad() > disponible) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se pueden devolver " + disponible + " unidad(es) de este producto");
            }

            Producto productoDevuelto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto devuelto no encontrado"));
            productoDevuelto.setStock(productoDevuelto.getStock() + detalle.getCantidad());
            productoRepository.save(productoDevuelto);

            if (detalle.getMotivo() == null || detalle.getMotivo().trim().isEmpty()) {
                detalle.setMotivo(devolucion.getMotivo());
            }
            detalle.setProducto(productoDevuelto);
            detalle.setDevolucion(devolucion);
            montoDevuelto += Montos.multiplicar(vendido.getPrecioUnitario(), detalle.getCantidad());
        }

        // 3. CAMBIO: descontar stock del nuevo producto; REEMBOLSO: registrar el monto
        if (devolucion.getNuevoProducto() != null) {
            Number idProductoNuevo = (Number) devolucion.getNuevoProducto().get("idProducto");
            Number cantidad = (Number) devolucion.getNuevoProducto().get("cantidad");
            if (idProductoNuevo == null || cantidad == null || cantidad.intValue() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datos del producto de cambio incompletos");
            }

            Producto productoNuevo = productoRepository.findById(idProductoNuevo.intValue())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto nuevo no encontrado"));
            if (productoNuevo.getStock() < cantidad.intValue()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock insuficiente para el cambio. Stock actual: " + productoNuevo.getStock());
            }
            productoNuevo.setStock(productoNuevo.getStock() - cantidad.intValue());
            productoRepository.save(productoNuevo);

            devolucion.setTipo(Devolucion.TIPO_CAMBIO);
            devolucion.setProductoCambio(productoNuevo);
            devolucion.setCantidadCambio(cantidad.intValue());
            devolucion.setMontoReembolso(null);
        } else {
            devolucion.setTipo(Devolucion.TIPO_REEMBOLSO);
            devolucion.setMontoReembolso(Montos.redondear(montoDevuelto));
        }

        // 4. Aprobada al registrar; el usuario (aprobador) sale del token
        devolucion.setIdDevolucion(null);
        devolucion.setEstado(Devolucion.ESTADO_APROBADA);
        devolucion.setUsuario(buscarUsuario(idUsuario));
        if (devolucion.getFechaDevolucion() == null) {
            devolucion.setFechaDevolucion(hoy);
        }

        return devolucionRepository.save(devolucion);
    }

    private Usuario buscarUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario de la sesión no encontrado"));
    }
}
