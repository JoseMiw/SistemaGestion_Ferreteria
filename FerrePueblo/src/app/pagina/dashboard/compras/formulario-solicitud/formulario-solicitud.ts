import { ChangeDetectorRef, Component } from '@angular/core';
import { ProductoResponse } from '../../../../models/ProductoResponse';
import { Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../../services/producto.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../../../services/solicitud.service';
import { ProveedorService } from '../../../../services/proveedor.service';
import { fechaLocalISO } from '../../../../utils/errores';



interface DetalleSolicitud {
  producto: ProductoResponse;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-formulario-solicitud',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formulario-solicitud.html',
  styleUrl: './formulario-solicitud.css',
})
export class FormularioSolicitud {
  // Datos del proveedor
  rucProveedor: string = '';
  nombreProveedor: string = '';
  proveedorEncontrado: boolean = false;
  mensajeError: string = '';
  cargando: boolean = false;

  // Datos del producto
  busquedaProducto: string = '';
  productosSugeridos: ProductoResponse[] = [];
  mostrarSugerencias: boolean = false;

  // Detalle de solicitud
  detalleSolicitud: DetalleSolicitud[] = [];
  subtotal: number = 0;
  igv: number = 0;
  totalPagar: number = 0;

  // Producto seleccionado
  productoSeleccionado: ProductoResponse | null = null;
  cantidadProducto: number = 1;

  // Usuario (por ahora fijo)
  idUsuario: number = 1;
  idProveedor: number = 0;

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private solicitudService: SolicitudService,
    private proveedorService: ProveedorService,
    private cdr: ChangeDetectorRef
  ) {}

  // ============================================
  // MÉTODOS PARA PROVEEDOR
  // ============================================

  buscarProveedor(): void {
    if (!this.rucProveedor || this.rucProveedor.length < 11) {
      this.mensajeError = 'Ingrese un RUC válido (11 dígitos)';
      this.nombreProveedor = '';
      this.proveedorEncontrado = false;
      this.cdr.detectChanges();
      return;
    }

    this.mensajeError = '';
    this.nombreProveedor = '';
    this.proveedorEncontrado = false;
    this.cargando = true;
    this.cdr.detectChanges();

    this.proveedorService.buscarPorRuc(this.rucProveedor).subscribe({
    next: (data) => {
      this.idProveedor = data.idProveedor;  // ← GUARDAR EL ID
      this.nombreProveedor = data.nombreProveedor;
      this.proveedorEncontrado = true;
      this.mensajeError = '';
      this.cargando = false;
      this.cdr.detectChanges();
      console.log('Proveedor encontrado:', data);
    },
    error: (err) => {
      console.error('Error al buscar proveedor:', err);
      this.nombreProveedor = '';
      this.proveedorEncontrado = false;
      this.mensajeError = 'Proveedor no encontrado';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  });
  }

  limpiarBusquedaProveedor(): void {
    if (!this.rucProveedor) {
      this.nombreProveedor = '';
      this.proveedorEncontrado = false;
      this.mensajeError = '';
      this.cdr.detectChanges();
    }
  }

  // ============================================
  // MÉTODOS PARA PRODUCTO
  // ============================================

  buscarProductos(): void {
    if (!this.busquedaProducto || this.busquedaProducto.length < 2) {
      this.productosSugeridos = [];
      this.mostrarSugerencias = false;
      return;
    }

    this.productoService.buscarPorNombre(this.busquedaProducto.trim()).subscribe({
      next: (productos) => {
        this.productosSugeridos = productos;
        this.mostrarSugerencias = this.productosSugeridos.length > 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar productos:', err);
        this.productosSugeridos = [];
        this.mostrarSugerencias = false;
      }
    });
  }

  seleccionarProducto(producto: ProductoResponse): void {
    this.productoSeleccionado = producto;
    this.busquedaProducto = producto.nombre;
    this.mostrarSugerencias = false;
    this.cantidadProducto = 1;
    this.cdr.detectChanges();
  }

  ocultarSugerencias(): void {
    setTimeout(() => {
      this.mostrarSugerencias = false;
      this.cdr.detectChanges();
    }, 200);
  }

  // ============================================
  // MÉTODOS PARA DETALLE
  // ============================================

  agregarProducto(): void {
    if (!this.productoSeleccionado) {
      alert('Primero busque y seleccione un producto');
      return;
    }

    if (this.cantidadProducto < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const existente = this.detalleSolicitud.find(
      d => d.producto.idProducto === this.productoSeleccionado?.idProducto
    );

    if (existente) {
      alert('Este producto ya está agregado');
      return;
    }

    const subtotal = this.productoSeleccionado.precioCompra * this.cantidadProducto;

    this.detalleSolicitud.push({
      producto: this.productoSeleccionado,
      cantidad: this.cantidadProducto,
      precioUnitario: this.productoSeleccionado.precioCompra,
      subtotal: subtotal
    });

    this.calcularTotal();
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.cantidadProducto = 1;
    this.mostrarSugerencias = false;
    this.cdr.detectChanges();
  }

  eliminarProducto(index: number): void {
    this.detalleSolicitud.splice(index, 1);
    this.calcularTotal();
    this.cdr.detectChanges();
  }

  actualizarCantidad(index: number, nuevaCantidad: number): void {
    if (nuevaCantidad < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    const item = this.detalleSolicitud[index];
    item.cantidad = nuevaCantidad;
    item.subtotal = item.producto.precioCompra * nuevaCantidad;
    this.calcularTotal();
    this.cdr.detectChanges();
  }

  calcularTotal(): void {
  this.totalPagar = this.detalleSolicitud.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalPagar = Math.round(this.totalPagar * 100) / 100;

  this.subtotal = Math.round((this.totalPagar / 1.18) * 100) / 100;
  this.igv = Math.round((this.totalPagar - this.subtotal) * 100) / 100;
  }

  limpiarTodo(): void {
    this.detalleSolicitud = [];
    this.subtotal = 0;
    this.igv = 0;
    this.totalPagar = 0;
    this.cdr.detectChanges();
  }

  // ============================================
  // REGISTRAR SOLICITUD
  // ============================================

  registrarSolicitud(): void {
    if (!this.proveedorEncontrado) {
        alert('Primero debe buscar un proveedor válido');
        return;
    }

    if (this.detalleSolicitud.length === 0) {
        alert('Debe agregar al menos un producto');
        return;
    }

    // ✅ ESTRUCTURA CORRECTA
    const solicitudData = {
        fechaCotizacion: fechaLocalISO(),
        montoTotal: this.totalPagar,
        proveedor: { idProveedor: this.idProveedor },  // ← Objeto, no directo
        usuario: { idUsuario: this.idUsuario },        // ← Objeto, no directo
        estado: 'PENDIENTE',
        detalleSolicitud: this.detalleSolicitud.map(item => ({
            producto: { idProducto: item.producto.idProducto! },
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal
        }))
    };

    console.log('Solicitud a registrar:', JSON.stringify(solicitudData, null, 2));

    this.solicitudService.crear(solicitudData).subscribe({
        next: (response) => {
            console.log('Solicitud creada:', response);
            alert('Solicitud registrada exitosamente');
            this.router.navigate(['/dashboard/compras']);
        },
        error: (err) => {
            console.error('Error al crear solicitud:', err);
            if (err.error) {
                console.error('Detalles del error:', err.error);
                alert(`Error: ${err.error.message || 'Error al registrar la solicitud'}`);
            } else {
                alert('Error al registrar la solicitud. Revisa la consola.');
            }
        }
    });
}

  cancelar(): void {
    this.router.navigate(['/dashboard/compras']);
  }
}
