package com.example.backend.model.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.model.entity.Producto;

public interface ProductoRepository extends JpaRepository<Producto,Integer>{
    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdProductoNot(String codigo, Integer idProducto);

    // RF01: productos con stock igual o inferior al mínimo
    @Query("SELECT p FROM Producto p WHERE p.stock <= p.stockMinimo ORDER BY p.stock ASC, p.nombre ASC")
    List<Producto> findStockBajo();

    // RF03: búsqueda por código exacto o nombre parcial
    @Query("SELECT p FROM Producto p WHERE LOWER(p.codigo) = LOWER(:texto) " +
           "OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :texto, '%')) ORDER BY p.nombre ASC")
    List<Producto> buscarPorCodigoONombre(@Param("texto") String texto);
}
