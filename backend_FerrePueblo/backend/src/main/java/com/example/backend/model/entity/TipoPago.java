package com.example.backend.model.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

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

@Entity
@Table(name = "tipo_pago")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipoPago {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idTipoPago")
    private Integer idTipoPago;

    @Column(name = "nombreTipo", nullable = false, length = 50)
    private String nombreTipo;

    @Column(length = 200)
    private String descripcion;

    @JsonIgnore
    @OneToMany(mappedBy = "tipoPago")
    private List<Venta> ventas;
}
