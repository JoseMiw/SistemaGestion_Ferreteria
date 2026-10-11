package com.example.backend.model.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "producto")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Producto {
    public static final String STOCK_NORMAL = "NORMAL";
    public static final String STOCK_BAJO = "BAJO";
    public static final String STOCK_AGOTADO = "AGOTADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idProducto")
    private Integer idProducto;

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 20, message = "El código debe tener como máximo 20 caracteres")
    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min=2,max=45,message = "Debe tener entre 2 y 45 letras")
    @Column(nullable = false)
    private String nombre;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    @Column(nullable = false)
    private Integer stock;

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    @Column(name = "stockMinimo", nullable = false)
    private Integer stockMinimo;
    
    @NotNull(message = "El precio de venta es obligatorio")
    @Positive(message = "El precio de venta debe ser mayor a 0")
    @Column(nullable = false)
    private Double precioVenta;

    @NotNull(message = "El precio de compra es obligatorio")
    @Positive(message = "El precio de compra debe ser mayor a 0")
    @Column(nullable = false)
    private Double precioCompra;

    @NotBlank(message = "La descripción es obligatoria")
    @Column(nullable = false)
    private String descripcion;

    @NotBlank(message = "El estado es obligatorio")
    @Column(nullable = false)
    private String estado;

    @ManyToOne
    @JoinColumn(name = "idProveedor")
    @JsonIgnoreProperties({"productos", "solicitudes"})
    private Proveedor proveedor;

    public Producto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    /**
     * Estado del stock (RF03): AGOTADO si no hay unidades, BAJO si está en o
     * por debajo del mínimo (RF01), NORMAL en otro caso.
     */
    @Transient
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public String getEstadoStock() {
        return clasificarStock(stock, stockMinimo);
    }

    public static String clasificarStock(Integer stock, Integer stockMinimo) {
        int actual = stock == null ? 0 : stock;
        int minimo = stockMinimo == null ? 0 : stockMinimo;
        if (actual <= 0) return STOCK_AGOTADO;
        if (actual <= minimo) return STOCK_BAJO;
        return STOCK_NORMAL;
    }
}
