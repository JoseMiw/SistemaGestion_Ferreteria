import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductoResponse } from '../../../../models/ProductoResponse';
import { Router, RouterLink } from '@angular/router';
import { VentaService } from '../../../../services/venta.service';
import { ProductoService } from '../../../../services/producto.service';
import { DevolucionService } from '../../../../services/devolucion.service';
import { DevolucionRequest } from '../../../../models/DevolucionRequest';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { fechaLocalISO } from '../../../../utils/errores';

@Component({
  selector: 'app-registrar-devolucion',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registrar-devolucion.html',
  styleUrl: './registrar-devolucion.css',
})
export class RegistrarDevolucion implements OnInit {
  // Datos de la devolución
  numeroComprobante: string = '';
  fecha: string = fechaLocalISO();
  motivo: string = '';
  tipoDevolucion: string = 'REEMBOLSO';

  // Venta encontrada
  ventaEncontrada: boolean = false;
  venta: any = null;
  mensajeError: string = '';
  cargando: boolean = false;

  // Producto seleccionado para devolver
  productoSeleccionado: any = null;
  cantidadDevolver: number = 1;

  // Productos disponibles para cambio
  productosDisponibles: ProductoResponse[] = [];
  nuevoProductoSeleccionado: ProductoResponse | null = null;
  cantidadNuevoProducto: number = 1;
  mostrarCambio: boolean = false;

  // Monto para reembolso
  montoReembolso: number = 0;

  // Usuario
  idUsuario: number = 1;

  diferenciaPrecio: number = 0;
  montoPagoDiferencia: number = 0;

  constructor(
    private router: Router,
    private ventaService: VentaService,
    private productoService: ProductoService,
    private devolucionService: DevolucionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.idUsuario = this.authService.getIdUsuario();
  }

  // ============================================
  // BUSCAR COMPROBANTE
  // ============================================

  buscarComprobante(): void {
    if (!this.numeroComprobante) {
      this.mensajeError = 'Ingrese un número de comprobante';
      this.ventaEncontrada = false;
      this.venta = null;
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.ventaEncontrada = false;
    this.venta = null;
    this.productoSeleccionado = null;
    this.cdr.detectChanges();

    const id = parseInt(this.numeroComprobante);

    this.ventaService.buscar(id).subscribe({
      next: (data: any) => {
        console.log('Venta encontrada:', data);
        
        if (!data.detalleVenta || data.detalleVenta.length === 0) {
          this.mensajeError = 'La venta no tiene productos asociados';
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        const fechaVenta = new Date(data.fechaVenta);
        const fechaActual = new Date();
        const diferenciaDias = Math.floor((fechaActual.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diferenciaDias > 3) {
          this.mensajeError = 'Han pasado más de 3 días desde la venta. No se puede realizar la devolución.';
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        this.venta = data;
        this.ventaEncontrada = true;
        this.cargando = false;
        this.mensajeError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar venta:', err);
        this.venta = null;
        this.ventaEncontrada = false;
        this.mensajeError = 'Comprobante no encontrado';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================
  // SELECCIONAR PRODUCTO A DEVOLVER
  // ============================================

  seleccionarProducto(producto: any): void {
    this.productoSeleccionado = producto;
    this.cantidadDevolver = 1;
    this.actualizarCantidadDevolver();
    if (this.tipoDevolucion === 'CAMBIO') {
        this.cargarProductosDisponibles();
    }
    this.cdr.detectChanges();
  }

  // Se llama al cambiar la cantidad a devolver: recalcula reembolso y diferencia
  actualizarCantidadDevolver(): void {
    if (!this.productoSeleccionado) return;
    this.montoReembolso = this.redondear(this.productoSeleccionado.precioUnitario * (this.cantidadDevolver || 0));
    if (this.nuevoProductoSeleccionado) {
        this.calcularDiferencia();
    }
    this.cdr.detectChanges();
  }

  seleccionarProductoCambio(producto: ProductoResponse): void {
    this.nuevoProductoSeleccionado = producto;
    // Por defecto se cambia la misma cantidad que se devuelve (sin exceder el stock)
    this.cantidadNuevoProducto = Math.min(this.cantidadDevolver || 1, producto.stock);
    this.calcularDiferencia();  // ← Calcular diferencia
    this.cdr.detectChanges();
  }

  // Total devuelto (a precio pagado en la venta) vs total del producto nuevo
  get totalDevuelto(): number {
    if (!this.productoSeleccionado) return 0;
    return this.redondear(this.productoSeleccionado.precioUnitario * (this.cantidadDevolver || 0));
  }

  get totalNuevo(): number {
    if (!this.nuevoProductoSeleccionado) return 0;
    return this.redondear(this.nuevoProductoSeleccionado.precioVenta * (this.cantidadNuevoProducto || 0));
  }

  calcularDiferencia(): void {
    if (this.productoSeleccionado && this.nuevoProductoSeleccionado) {
        this.diferenciaPrecio = this.redondear(this.totalNuevo - this.totalDevuelto);
        this.montoPagoDiferencia = this.diferenciaPrecio > 0 ? this.diferenciaPrecio : 0;
        this.cdr.detectChanges();
    }
  }

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  cambiarTipoDevolucion(tipo: string): void {
    this.tipoDevolucion = tipo;
    this.diferenciaPrecio = 0;
    this.montoPagoDiferencia = 0;
    if (this.tipoDevolucion === 'CAMBIO') {
        this.mostrarCambio = true;
        this.cargarProductosDisponibles();
    } else {
        this.mostrarCambio = false;
        this.nuevoProductoSeleccionado = null;
    }
    this.cdr.detectChanges();
  }

  // ============================================
  // CARGAR PRODUCTOS PARA CAMBIO
  // ============================================

  cargarProductosDisponibles(): void {
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos.filter(p => 
          p.idProducto !== this.productoSeleccionado?.producto.idProducto && p.stock > 0
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
      }
    });
  }

  // ============================================
  // REGISTRAR DEVOLUCIÓN (ACTUALIZADO)
  // ============================================

  registrarDevolucion(): void {
    if (!this.ventaEncontrada) {
        alert('Primero debe buscar un comprobante válido');
        return;
    }

    if (!this.productoSeleccionado) {
        alert('Seleccione un producto para devolver');
        return;
    }

    if (!this.motivo || this.motivo.trim() === '') {
        alert('Ingrese el motivo de la devolución');
        return;
    }

    if (!Number.isInteger(this.cantidadDevolver) || this.cantidadDevolver < 1 || this.cantidadDevolver > this.productoSeleccionado.cantidad) {
        alert(`La cantidad a devolver debe estar entre 1 y ${this.productoSeleccionado.cantidad}`);
        return;
    }

    if (this.tipoDevolucion === 'CAMBIO' && !this.nuevoProductoSeleccionado) {
        alert('Seleccione un producto para el cambio');
        return;
    }

    if (this.tipoDevolucion === 'CAMBIO' && this.nuevoProductoSeleccionado &&
        (!Number.isInteger(this.cantidadNuevoProducto) || this.cantidadNuevoProducto < 1 || this.cantidadNuevoProducto > this.nuevoProductoSeleccionado.stock)) {
        alert(`La cantidad del producto de cambio debe estar entre 1 y ${this.nuevoProductoSeleccionado.stock}`);
        return;
    }

    if (this.tipoDevolucion === 'CAMBIO' && this.diferenciaPrecio > 0) {
        if (this.montoPagoDiferencia < this.diferenciaPrecio) {
            alert(`El cliente debe pagar S/. ${this.diferenciaPrecio.toFixed(2)} por la diferencia`);
            return;
        }
    }

    const devolucionData: DevolucionRequest = {
        fechaDevolucion: this.fecha,
        motivo: this.motivo,
        idVenta: this.venta.idVenta,      // ← Directo
        idUsuario: this.idUsuario, 
        detalleDevolucion: [{
            producto: { idProducto: this.productoSeleccionado.producto.idProducto },
            cantidad: this.cantidadDevolver,
            motivo: this.motivo
        }],
        // ✅ Agregar nuevo producto si es cambio
        nuevoProducto: this.tipoDevolucion === 'CAMBIO' && this.nuevoProductoSeleccionado ? {
            idProducto: this.nuevoProductoSeleccionado.idProducto!,
            cantidad: this.cantidadNuevoProducto
        } : undefined
    };

    console.log('Devolución a registrar:', JSON.stringify(devolucionData, null, 2));

    this.devolucionService.crear(devolucionData).subscribe({
        next: (response) => {
            console.log('Devolución registrada exitosamente:', response);
            alert('Operación registrada correctamente');
            this.router.navigate(['/dashboard/ventas']);
        },
        error: (err) => {
            console.error('Error al registrar devolución:', err);
            if (err.error) {
                console.error('Detalles del error:', err.error);
                alert(`Error: ${err.error.message || 'Error al registrar la devolución'}`);
            } else {
                alert('Error al registrar la devolución. Revisa la consola.');
            }
        }
    });
}

  cancelar(): void {
    this.router.navigate(['/dashboard/ventas']);
  }
}
