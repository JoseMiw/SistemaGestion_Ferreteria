package com.example.backend.model.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idUsuario")
    private Integer idUsuario;

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre de usuario debe tener entre 3 y 50 caracteres")
    @Column(name = "nombreUsuario", nullable = false, unique = true, length = 50)
    private String nombreUsuario;

    // Se guarda cifrada con BCrypt; nunca se envía en las respuestas JSON (RNF01)
    @NotBlank(message = "La contraseña es obligatoria")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @ToString.Exclude
    @Column(name = "contraseña", nullable = false, length = 255)
    private String contraseña;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(min = 2, max = 100, message = "Los nombres deben tener entre 2 y 100 caracteres")
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(min = 2, max = 100, message = "Los apellidos deben tener entre 2 y 100 caracteres")
    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo debe ser válido")
    @Column(name = "correo", nullable = false, unique = true, length = 100)
    private String correo;

    @Column(name = "rol", length = 50)
    private String rol;

    // Bloqueo por intentos fallidos consecutivos (RNF01)
    @JsonIgnore
    @Column(name = "intentosFallidos", nullable = false)
    private Integer intentosFallidos = 0;

    @JsonIgnore
    @Column(name = "bloqueadoHasta")
    private LocalDateTime bloqueadoHasta;

    @JsonIgnore
    @OneToMany(mappedBy = "usuario")
    @ToString.Exclude 
    private List<Venta> ventas;

    @JsonIgnore
    @OneToMany(mappedBy = "usuario")
    @ToString.Exclude 
    private List<SolicitudCompra> solicitudes;

    public Usuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }
}
