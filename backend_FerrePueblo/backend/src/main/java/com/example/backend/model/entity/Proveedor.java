package com.example.backend.model.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "proveedor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idProveedor")
    private Integer idProveedor;

    @Column(name = "ruc", nullable = false, unique = true, length = 11)
    private String ruc;

    @Column(name = "nombreProveedor", nullable = false, length = 150)
    private String nombreProveedor;

    @Column(length = 15)
    private String telefono;

    @Column(length = 100)
    private String correo;

    @Column(length = 200)
    private String direccion;

    @JsonIgnore
    @OneToMany(mappedBy = "proveedor")
    @ToString.Exclude
    private List<SolicitudCompra> solicitudes;

    @JsonIgnore
    @OneToMany(mappedBy = "proveedor")
    @ToString.Exclude
    private List<Producto> productos;

    // ✅ CONSTRUCTOR CON SOLO EL ID
    public Proveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }
}
