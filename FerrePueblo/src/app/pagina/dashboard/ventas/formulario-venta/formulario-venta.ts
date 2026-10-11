import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteResponse } from '../../../../models/ClienteResponse';
import { ClienteService } from '../../../../services/cliente.service';
import { ProductoResponse } from '../../../../models/ProductoResponse';
import { ProductoService } from '../../../../services/producto.service';
import { VentaRequest } from '../../../../models/VentaRequest';
import { VentaService } from '../../../../services/venta.service';
import { AuthService } from '../../../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { fechaLocalISO, mensajeError } from '../../../../utils/errores';

// Interface para el detalle de venta
interface DetalleVenta {
  producto: ProductoResponse;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-formulario-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-venta.html',
  styleUrl: './formulario-venta.css',
})
export class FormularioVenta {
  // Datos del cliente
  dniCliente: string = '';
  idClienteSeleccionado: number | null = null;
  nombreCliente: string = '';
  clienteEncontrado: boolean = false;
  mensajeError: string = '';
  clientes: ClienteResponse[] = [];
  cargando: boolean=false;

  // Datos del producto
  busquedaProducto: string = '';
  productosSugeridos: ProductoResponse[] = [];
  mostrarSugerencias: boolean = false;

  // Detalle de venta
  detalleVenta: DetalleVenta[] = [];
  totalVenta: number = 0;

  // Variables para el producto seleccionado
  productoSeleccionado: ProductoResponse | null = null;
  cantidadProducto: number = 1;

  tipoPagoSeleccionado: string = 'EFECTIVO';
  tipoComprobanteSeleccionado: string = 'FACTURA';
  idUsuario: number = 1;
  subtotal: number = 0;
  igv: number = 0;
  totalPagar: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef,
    private productoService: ProductoService,
    private ventaService: VentaService,
    private authService: AuthService
  ){}

   ngOnInit(): void {
  this.idUsuario = this.authService.getIdUsuario();

  // Al volver de "Registrar cliente" llega el DNI del cliente nuevo
  const dni = this.route.snapshot.queryParamMap.get('dni');
  if (dni) {
    this.dniCliente = dni;
    this.buscarCliente();
  }
  }
  // Buscar cliente por DNI; la venta se guarda con su ID interno
  buscarCliente(): void {
    const dni = this.dniCliente.trim();
    if (!/^\d{8}$/.test(dni)) {
      this.mensajeError = 'Ingrese un DNI válido de 8 dígitos';
      this.nombreCliente = '';
      this.clienteEncontrado = false;
      this.idClienteSeleccionado = null;
      this.cdr.detectChanges();
      return;
    }

    // Limpiar mensajes anteriores
    this.mensajeError = '';
    this.nombreCliente = '';
    this.clienteEncontrado = false;
    this.idClienteSeleccionado = null;
    this.cargando = true;
    this.cdr.detectChanges();

    this.clienteService.buscarPorDni(dni).subscribe({
      next: (cliente) => {
        this.nombreCliente = `${cliente.nombres} ${cliente.apellidos}`;
        this.idClienteSeleccionado = cliente.idCliente ?? null;
        this.clienteEncontrado = true;
        this.mensajeError = '';
        this.cargando = false;
        this.cdr.detectChanges();  // ← Forzar actualización después de recibir datos
      },
      error: (err) => {
        console.error('Error al buscar cliente:', err);
        this.nombreCliente = '';
        this.clienteEncontrado = false;
        this.idClienteSeleccionado = null;
        this.mensajeError = err.status === 404 ? 'Cliente no registrado con ese DNI' : (err.error?.message || 'Error al buscar el cliente');
        this.cargando = false;
        this.cdr.detectChanges();  // ← Forzar actualización en error
      }
    });
  }

  // Si se modifica el DNI, el cliente encontrado deja de ser válido
  limpiarBusqueda(): void {
    this.nombreCliente = '';
    this.clienteEncontrado = false;
    this.idClienteSeleccionado = null;
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  buscarProductos(): void {
    if (!this.busquedaProducto || this.busquedaProducto.length < 2) {
      this.productosSugeridos = [];
      this.mostrarSugerencias = false;
      return;
    }

    // Buscar productos por nombre
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
    // Retrasar para permitir que el click en la sugerencia se ejecute
    setTimeout(() => {
      this.mostrarSugerencias = false;
      this.cdr.detectChanges();
    }, 200);
  }

  agregarProducto(): void {
    if (!this.productoSeleccionado) {
      alert('Primero busque y seleccione un producto');
      return;
    }

    if (this.cantidadProducto < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    // Verificar si el producto ya está en el detalle
    const existente = this.detalleVenta.find(
      d => d.producto.idProducto === this.productoSeleccionado?.idProducto
    );

    if (existente) {
      alert('Este producto ya está agregado. Puede modificar la cantidad directamente en la tabla.');
      return;
    }
    // Calcular subtotal
    const subtotal = this.productoSeleccionado.precioVenta * this.cantidadProducto;

    // Agregar al detalle
    this.detalleVenta.push({
      producto: this.productoSeleccionado,
      cantidad: this.cantidadProducto,
      subtotal: subtotal
    });
    // Actualizar total
    this.calcularTotal();

    // Limpiar selección
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.cantidadProducto = 1;
    this.mostrarSugerencias = false;

    console.log('Producto agregado:', this.detalleVenta);
    this.cdr.detectChanges();
  }

  eliminarProducto(index: number): void {
    this.detalleVenta.splice(index, 1);
    this.calcularTotal();
    this.cdr.detectChanges();
  }

  actualizarCantidad(index: number, nuevaCantidad: number): void {
    if (nuevaCantidad < 1) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    const item = this.detalleVenta[index];
    item.cantidad = nuevaCantidad;
    item.subtotal = item.producto.precioVenta * nuevaCantidad;
    this.calcularTotal();
    this.cdr.detectChanges();
  }

  // DESPUÉS
  calcularTotal(): void {
  // El precio de cada producto (precioVenta) ya incluye el IGV.
  // El total a pagar es la suma directa de los subtotales de línea.
  this.totalPagar = this.detalleVenta.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalPagar = Math.round(this.totalPagar * 100) / 100;

  // Se desglosa el IGV a partir del total, en vez de sumarlo aparte
  this.subtotal = Math.round((this.totalPagar / 1.18) * 100) / 100;
  this.igv = Math.round((this.totalPagar - this.subtotal) * 100) / 100;
  }

  cancelar(): void{
    this.router.navigate(['/dashboard/ventas']);
  }

  registrarVenta(): void {
  // Validaciones
  if (!this.clienteEncontrado) {
    alert('Primero debe buscar un cliente válido');
    return;
  }

  if (this.detalleVenta.length === 0) {
    alert('Debe agregar al menos un producto');
    return;
  }

  // Validación de stock
  for (const item of this.detalleVenta) {
    if (item.producto.stock === undefined || item.producto.stock < item.cantidad) {
      alert(`No hay suficiente stock para "${item.producto.nombre}". Stock disponible: ${item.producto.stock || 0}`);
      return;
    }
  }

  const idTipoPago = this.obtenerIdTipoPago(this.tipoPagoSeleccionado);

  // El backend vuelve a validar el stock, calcula los montos, descuenta el
  // inventario y fija la fecha y el vendedor, todo en una transacción (RF06, RNF04)
  const ventaData = {
    fechaVenta: fechaLocalISO(),
    subtotal: this.subtotal,
    igv: this.igv,
    total: this.totalPagar,
    tipoComprobante: this.tipoComprobanteSeleccionado,
    cliente: { idCliente: this.idClienteSeleccionado! },
    usuario: { idUsuario: this.idUsuario },
    tipoPago: { idTipoPago: idTipoPago },
    detalleVenta: this.detalleVenta.map(item => ({
      producto: { idProducto: item.producto.idProducto! },  // ✅ Solo el ID
      cantidad: item.cantidad,
      precioUnitario: item.producto.precioVenta,
      subtotal: item.subtotal
    }))
  };

  console.log('Enviando datos al backend:', JSON.stringify(ventaData, null, 2));

  this.ventaService.crear(ventaData).subscribe({
    next: (response) => {
      console.log('Venta creada exitosamente:', response);
      this.router.navigate(['/dashboard/ventas']);
    },
    error: (err: HttpErrorResponse) => {
      console.error('Error al crear venta:', err);
      alert(mensajeError(err, 'Error al registrar la venta'));
    }
  });
}

  // IDs de la tabla tipo_pago
  obtenerIdTipoPago(tipo: string): number {
  const tipos: { [key: string]: number } = {
    'EFECTIVO': 1,
    'TARJETA_CREDITO': 2,
    'TARJETA_DEBITO': 3,
    'TRANSFERENCIA': 4,
    'YAPE': 5
  };
  return tipos[tipo] || 1;
}

registrarCliente(): void {
  // Navegar al formulario de cliente con un parámetro 'origen=venta'
  this.router.navigate(['/dashboard/clientes/nuevo'], { 
    queryParams: { origen: 'venta' } 
  });
}
}
