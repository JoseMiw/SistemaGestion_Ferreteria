package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.Producto;

public interface ProductoService {
    public List<Producto> cargarProductos();
    public Producto crear(Producto producto);
    public Producto buscarPorId(Integer id);
    public Producto actualizar(Integer id,Producto producto);
    public void eliminar(Integer id);
    public List<Producto> buscarPorNombre(String nombre);
    public Producto actualizarStock(Integer id, Integer cantidad);
    Producto aumentarStock(Integer id, Integer cantidad);
    List<Producto> listarStockBajo();
    List<Producto> consultarStock(String texto);
}
