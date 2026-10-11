package com.example.backend.model.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.Cotizacion;
import com.example.backend.model.entity.DetalleCotizacion;
import com.example.backend.model.entity.Producto;
import com.example.backend.model.entity.Proveedor;
import com.example.backend.model.entity.SolicitudCompra;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.CotizacionRepository;
import com.example.backend.model.repository.ProductoRepository;
import com.example.backend.model.repository.ProveedorRepository;
import com.example.backend.model.repository.SolicitudCompraRepository;
import com.example.backend.util.Montos;
import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CotizacionServiceImpl implements CotizacionService {

    private final CotizacionRepository cotizacionRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final SolicitudCompraRepository solicitudCompraRepository;
    private final Clock clock;
    private final UsuarioRepository usuarioRepository;

    @Override
    public List<Cotizacion> listar() {
        return cotizacionRepository.findAllByOrderByIdCotizacionDesc();
    }

    @Override
    public Cotizacion buscarPorId(Integer id) {
        return cotizacionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cotización no encontrada con ID: " + id));
    }

    /**
     * RF04 / CA07-CA08: la cotización queda asociada al proveedor con fecha,
     * vigencia, productos, cantidades y precios positivos; si algo falta no se guarda.
     */
    @Override
    @Transactional
    public Cotizacion crear(Cotizacion cotizacion, Integer idUsuario) {
        if (cotizacion.getProveedor() == null || cotizacion.getProveedor().getIdProveedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proveedor es obligatorio");
        }
        Proveedor proveedor = proveedorRepository.findById(cotizacion.getProveedor().getIdProveedor())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proveedor no encontrado"));

        if (cotizacion.getFechaCotizacion() == null) {
            cotizacion.setFechaCotizacion(LocalDate.now(clock));
        }
        if (cotizacion.getFechaVigencia() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de vigencia es obligatoria");
        }
        if (cotizacion.getFechaVigencia().isBefore(cotizacion.getFechaCotizacion())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La fecha de vigencia no puede ser anterior a la fecha de la cotización");
        }

        SolicitudCompra solicitud = null;
        if (cotizacion.getSolicitudCompra() != null && cotizacion.getSolicitudCompra().getIdSolicitudCompra() != null) {
            solicitud = solicitudCompraRepository.findById(cotizacion.getSolicitudCompra().getIdSolicitudCompra())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solicitud de compra no encontrada"));
            if ("RECHAZADA".equals(solicitud.getEstado())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede cotizar una solicitud RECHAZADA");
            }
        }

        if (cotizacion.getDetalleCotizacion() == null || cotizacion.getDetalleCotizacion().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe agregar al menos un producto");
        }

        Set<Integer> productosVistos = new HashSet<>();
        double total = 0;
        for (DetalleCotizacion detalle : cotizacion.getDetalleCotizacion()) {
            if (detalle.getProducto() == null || detalle.getProducto().getIdProducto() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no indicado en el detalle");
            }
            if (detalle.getCantidad() == null || detalle.getCantidad() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor a 0");
            }
            if (detalle.getPrecioUnitario() == null || detalle.getPrecioUnitario() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio unitario debe ser mayor a 0");
            }
            if (!productosVistos.add(detalle.getProducto().getIdProducto())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un producto no puede repetirse en la cotización");
            }
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no encontrado"));

            detalle.setProducto(producto);
            detalle.setSubtotal(Montos.multiplicar(detalle.getPrecioUnitario(), detalle.getCantidad()));
            detalle.setCotizacion(cotizacion);
            total += detalle.getSubtotal();
        }

        // La solicitud avanza a COTIZADA al registrar su primera cotización
        if (solicitud != null && SolicitudCompra.ESTADO_PENDIENTE.equals(solicitud.getEstado())) {
            solicitud.setEstado(SolicitudCompra.ESTADO_COTIZADA);
            solicitudCompraRepository.save(solicitud);
        }

        cotizacion.setIdCotizacion(null);
        cotizacion.setEstado(Cotizacion.ESTADO_REGISTRADA);
        cotizacion.setProveedor(proveedor);
        cotizacion.setSolicitudCompra(solicitud);
        cotizacion.setUsuario(buscarUsuario(idUsuario));
        cotizacion.setMontoTotal(Montos.redondear(total));

        return cotizacionRepository.save(cotizacion);
    }

    private Usuario buscarUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario de la sesión no encontrado"));
    }
}
