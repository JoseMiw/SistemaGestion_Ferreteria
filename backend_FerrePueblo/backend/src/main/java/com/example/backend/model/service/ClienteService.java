package com.example.backend.model.service;

import java.util.List;

import com.example.backend.model.entity.Cliente;

public interface ClienteService {
    public List<Cliente> listarClientes();
    public Cliente buscarPorId(Integer id);
    public Cliente buscarPorDni(String dni);
    public Cliente crear(Cliente cliente);
    public Cliente actualizar(Integer id, Cliente cliente);
    public void eliminar(Integer id);
}
