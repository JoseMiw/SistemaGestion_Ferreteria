package com.example.backend.model.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.backend.model.entity.Proveedor;
import com.example.backend.model.repository.ProveedorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProveedorServiceImpl implements ProveedorService{
    private final ProveedorRepository proveedorRepository;

    @Override
    public List<Proveedor> listar() {
        return proveedorRepository.findAll();
    }    

    @Override
    public Proveedor buscarPorId(Integer id) {
        return proveedorRepository.findById(id)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "Proveedor no encontrado con ID: " + id));
    }

    @Override
    public Proveedor buscarPorRuc(String ruc) {
        return proveedorRepository.findByRuc(ruc);
    }

    @Override
    public Proveedor crear(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    @Override
    public Proveedor actualizar(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    @Override
    public void eliminar(Integer id) {
       proveedorRepository.deleteById(id);
    }

}
