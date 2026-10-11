package com.example.backend.model.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.DetalleSolicitudCompra;
import com.example.backend.model.entity.Producto;
import com.example.backend.model.entity.Proveedor;
import com.example.backend.model.entity.SolicitudCompra;
import com.example.backend.model.entity.Usuario;
import com.example.backend.model.repository.CotizacionRepository;
import com.example.backend.model.repository.GuiaEntradaRepository;
import com.example.backend.model.repository.ProductoRepository;
import com.example.backend.model.repository.ProveedorRepository;
import com.example.backend.model.repository.SolicitudCompraRepository;
import com.example.backend.util.Montos;
import com.example.backend.model.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SolicitudCompraServiceImpl implements SolicitudCompraService{
    private final SolicitudCompraRepository solicitudCompraRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final CotizacionRepository cotizacionRepository;
    private final GuiaEntradaRepository guiaEntradaRepository;
    private final Clock clock;
    private final UsuarioRepository usuarioRepository;

    @Override
    public List<SolicitudCompra> listar() {
        return solicitudCompraRepository.findAll();
    }

    @Override
    public SolicitudCompra buscarPorId(Integer id) {
        return solicitudCompraRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada con ID: " + id));
    }

    /** RF02: no se guarda si falta proveedor, productos o alguna cantidad es menor o igual a 0. */
    @Override
    @Transactional
    public SolicitudCompra crear(SolicitudCompra solicitud, Integer idUsuario) {
        if (solicitud.getProveedor() == null || solicitud.getProveedor().getIdProveedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proveedor es obligatorio");
        }
        Proveedor proveedor = proveedorRepository.findById(solicitud.getProveedor().getIdProveedor())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proveedor no encontrado"));

        if (solicitud.getDetalleSolicitud() == null || solicitud.getDetalleSolicitud().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe agregar al menos un producto");
        }

        double total = 0;
        for (DetalleSolicitudCompra detalle : solicitud.getDetalleSolicitud()) {
            if (detalle.getProducto() == null || detalle.getProducto().getIdProducto() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no indicado en el detalle");
            }
            if (detalle.getCantidad() == null || detalle.getCantidad() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor a 0");
            }
            Producto producto = productoRepository.findById(detalle.getProducto().getIdProducto())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto no encontrado"));

            double precio = detalle.getPrecioUnitario() != null && detalle.getPrecioUnitario() > 0
                ? detalle.getPrecioUnitario() : producto.getPrecioCompra();
            detalle.setProducto(producto);
            detalle.setPrecioUnitario(precio);
            detalle.setSubtotal(Montos.multiplicar(precio, detalle.getCantidad()));
            detalle.setSolicitudCompra(solicitud);
            total += detalle.getSubtotal();
        }

        solicitud.setIdSolicitudCompra(null);
        solicitud.setEstado(SolicitudCompra.ESTADO_PENDIENTE);
        solicitud.setProveedor(proveedor);
        solicitud.setUsuario(buscarUsuario(idUsuario));
        solicitud.setMontoTotal(Montos.redondear(total));
        if (solicitud.getFechaCotizacion() == null) {
            solicitud.setFechaCotizacion(LocalDate.now(clock));
        }

        return solicitudCompraRepository.save(solicitud);
    }


    @Override
    @Transactional
    public void eliminar(Integer id) {
        SolicitudCompra solicitud = buscarPorId(id);
        if (cotizacionRepository.existsBySolicitudCompra_IdSolicitudCompra(id)
                || guiaEntradaRepository.existsBySolicitudCompra_IdSolicitudCompra(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar la solicitud porque tiene cotizaciones o entregas asociadas");
        }
        solicitudCompraRepository.delete(solicitud);
    }

    private Usuario buscarUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario de la sesión no encontrado"));
    }
}
