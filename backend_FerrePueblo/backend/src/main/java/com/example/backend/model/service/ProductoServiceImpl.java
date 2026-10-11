package com.example.backend.model.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.Producto;
import com.example.backend.model.repository.ProductoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService{
    private final ProductoRepository productoRepository;

    @Override
    public List<Producto> cargarProductos() {
        return productoRepository.findAll();
    }

    @Override
    public Producto crear(Producto producto){
        producto.setIdProducto(null);
        producto.setCodigo(producto.getCodigo().trim().toUpperCase());
        if (productoRepository.existsByCodigoIgnoreCase(producto.getCodigo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un producto con el código " + producto.getCodigo());
        }
        return productoRepository.save(producto);
    }

    @Override
    public Producto buscarPorId(Integer id) {
        return productoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    @Override
    public Producto actualizar(Integer id, Producto producto) {
        Producto productoexistente=buscarPorId(id);

        String codigo = producto.getCodigo().trim().toUpperCase();
        if (productoRepository.existsByCodigoIgnoreCaseAndIdProductoNot(codigo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro producto con el código " + codigo);
        }

        productoexistente.setCodigo(codigo);
        productoexistente.setNombre(producto.getNombre());
        productoexistente.setStock(producto.getStock());
        productoexistente.setStockMinimo(producto.getStockMinimo());
        productoexistente.setPrecioVenta(producto.getPrecioVenta());
        productoexistente.setPrecioCompra(producto.getPrecioCompra());
        productoexistente.setDescripcion(producto.getDescripcion());
        productoexistente.setEstado(producto.getEstado());

        return productoRepository.save(productoexistente);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        Producto producto=buscarPorId(id);
        try {
            productoRepository.delete(producto);
            productoRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar el producto porque tiene ventas, compras o devoluciones registradas. Puede marcarlo como INACTIVO.");
        }
    }

    @Override
    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @Override
    @Transactional
    public Producto actualizarStock(Integer id, Integer cantidad) {
        Producto producto = buscarPorId(id);

        //Verifica si hay suficiente stock
        if (producto.getStock() < cantidad) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock insuficiente. Stock actual: " + producto.getStock());
        }

        //Resta la cantidad del stock
        producto.setStock(producto.getStock() - cantidad);
        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public Producto aumentarStock(Integer id, Integer cantidad) {
    Producto producto = buscarPorId(id);
    producto.setStock(producto.getStock() + cantidad);
    return productoRepository.save(producto);
    }

    @Override
    public List<Producto> listarStockBajo() {
        return productoRepository.findStockBajo();
    }

    @Override
    public List<Producto> consultarStock(String texto) {
        if (texto == null || texto.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrese un código o nombre para buscar");
        }
        return productoRepository.buscarPorCodigoONombre(texto.trim());
    }
}
