package com.example.backend.model.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.model.entity.Cliente;
import com.example.backend.model.repository.ClienteRepository;
import com.example.backend.model.repository.VentaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService{
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;

    @Override
    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    @Override
    public Cliente buscarPorId(Integer id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado con ID: " + id));
    }

    // El DNI es único: identifica al cliente en el mostrador
    @Override
    public Cliente buscarPorDni(String dni) {
        if (dni == null || !dni.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI debe tener exactamente 8 dígitos numéricos");
        }
        return clienteRepository.findByDni(dni)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay ningún cliente registrado con el DNI " + dni));
    }

    @Override
    public Cliente crear(Cliente cliente) {
        if (clienteRepository.existsByDni(cliente.getDni())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un cliente con el DNI " + cliente.getDni());
        }
        cliente.setIdCliente(null);
        return clienteRepository.save(cliente);
    }

    @Override
    @Transactional
    public Cliente actualizar(Integer id, Cliente cliente) {
        Cliente clienteExistente = buscarPorId(id);

        if (clienteRepository.existsByDniAndIdClienteNot(cliente.getDni(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro cliente con el DNI " + cliente.getDni());
        }

        clienteExistente.setDni(cliente.getDni());
        clienteExistente.setNombres(cliente.getNombres());
        clienteExistente.setApellidos(cliente.getApellidos());
        clienteExistente.setTelefono(cliente.getTelefono());
        clienteExistente.setCorreo(cliente.getCorreo());

        return clienteRepository.save(clienteExistente);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        Cliente cliente = buscarPorId(id);

        // Un cliente con ventas no se puede borrar (la FK de venta lo impide)
        if (ventaRepository.existsByCliente_IdCliente(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar el cliente porque tiene ventas registradas");
        }

        clienteRepository.delete(cliente);
    }

}
