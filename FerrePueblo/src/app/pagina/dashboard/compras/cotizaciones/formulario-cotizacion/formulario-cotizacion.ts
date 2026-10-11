import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoResponse } from '../../../../../models/ProductoResponse';
import { ProductoService } from '../../../../../services/producto.service';
import { ProveedorResponse, ProveedorService } from '../../../../../services/proveedor.service';
import { SolicitudService } from '../../../../../services/solicitud.service';
import { CotizacionService } from '../../../../../services/cotizacion.service';
import { fechaLocalISO, mensajeError } from '../../../../../utils/errores';

interface ItemCotizacion {
  producto: ProductoResponse;
  cantidad: number;
  precioUnitario: number;
}

/** RF04: registrar la cotización de un proveedor con fecha, vigencia, productos, cantidades y precios positivos. */
@Component({
  selector: 'app-formulario-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-cotizacion.html',
})
export class FormularioCotizacion implements OnInit {
  // Solicitud de origen (opcional)
  idSolicitud: number | null = null;
  mensajeSolicitud = '';

  // Proveedor
  rucProveedor = '';
  proveedor: ProveedorResponse | null = null;

  // Fechas
  fechaCotizacion = fechaLocalISO();
  fechaVigencia = fechaLocalISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Productos
  busquedaProducto = '';
  productosSugeridos: ProductoResponse[] = [];
  items: ItemCotizacion[] = [];

  errores: { [campo: string]: string } = {};
  errorGeneral = '';
  guardando = false;

  constructor(
    private productoService: ProductoService,
    private proveedorService: ProveedorService,
    private solicitudService: SolicitudService,
    private cotizacionService: CotizacionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Viene desde el detalle de una solicitud: /cotizaciones/nuevo?solicitud=N
    const solicitud = Number(this.route.snapshot.queryParamMap.get('solicitud'));
    if (solicitud > 0) {
      this.idSolicitud = solicitud;
      this.cargarSolicitud();
    }
  }

  // Carga proveedor y productos desde una solicitud existente
  cargarSolicitud(): void {
    this.mensajeSolicitud = '';
    if (!this.idSolicitud || this.idSolicitud < 1) {
      this.errores['solicitud'] = 'Ingrese un número de solicitud válido';
      return;
    }
    delete this.errores['solicitud'];

    this.solicitudService.buscar(this.idSolicitud).subscribe({
      next: (s: any) => {
        if (s.estado === 'RECHAZADA') {
          this.errores['solicitud'] = 'La solicitud está RECHAZADA; no se puede cotizar';
          this.cdr.detectChanges();
          return;
        }
        this.proveedor = s.proveedor;
        this.rucProveedor = s.proveedor?.ruc || '';
        delete this.errores['proveedor'];
        this.items = (s.detalleSolicitud || []).map((d: any) => ({
          producto: d.producto,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario
        }));
        this.mensajeSolicitud = `Se cargaron el proveedor y ${this.items.length} producto(s) de la solicitud N° ${s.idSolicitudCompra}. Actualice los precios según la cotización del proveedor.`;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.errores['solicitud'] = err.status === 404 ? 'Solicitud no encontrada' : mensajeError(err, 'No se pudo cargar la solicitud');
        this.cdr.detectChanges();
      }
    });
  }

  buscarProveedor(): void {
    if (!/^\d{11}$/.test(this.rucProveedor)) {
      this.errores['proveedor'] = 'Ingrese un RUC válido de 11 dígitos';
      this.proveedor = null;
      return;
    }
    this.proveedorService.buscarPorRuc(this.rucProveedor).subscribe({
      next: (p) => {
        this.proveedor = p;
        delete this.errores['proveedor'];
        this.cdr.detectChanges();
      },
      error: () => {
        this.proveedor = null;
        this.errores['proveedor'] = 'Proveedor no encontrado';
        this.cdr.detectChanges();
      }
    });
  }

  buscarProductos(): void {
    const texto = this.busquedaProducto.trim();
    if (texto.length < 2) {
      this.productosSugeridos = [];
      return;
    }
    this.productoService.buscarPorNombre(texto).subscribe({
      next: (data) => {
        this.productosSugeridos = data;
        this.cdr.detectChanges();
      }
    });
  }

  agregarProducto(p: ProductoResponse): void {
    delete this.errores['productos'];
    if (this.items.some(i => i.producto.idProducto === p.idProducto)) {
      this.errores['productos'] = `"${p.nombre}" ya está en la cotización`;
      return;
    }
    this.items.push({ producto: p, cantidad: 1, precioUnitario: p.precioCompra });
    this.busquedaProducto = '';
    this.productosSugeridos = [];
  }

  quitarProducto(index: number): void {
    this.items.splice(index, 1);
  }

  subtotal(item: ItemCotizacion): number {
    return Math.round((item.cantidad || 0) * (item.precioUnitario || 0) * 100) / 100;
  }

  get total(): number {
    return Math.round(this.items.reduce((s, i) => s + this.subtotal(i), 0) * 100) / 100;
  }

  itemInvalido(item: ItemCotizacion): boolean {
    return !(item.cantidad >= 1 && Number.isInteger(item.cantidad)) || !(item.precioUnitario > 0);
  }

  private validar(): boolean {
    this.errores = {};
    if (!this.proveedor) this.errores['proveedor'] = 'Busque y seleccione un proveedor';
    if (!this.fechaCotizacion) this.errores['fechaCotizacion'] = 'Ingrese la fecha de la cotización';
    if (!this.fechaVigencia) {
      this.errores['fechaVigencia'] = 'Ingrese la fecha de vigencia';
    } else if (this.fechaCotizacion && this.fechaVigencia < this.fechaCotizacion) {
      this.errores['fechaVigencia'] = 'La vigencia no puede ser anterior a la fecha de la cotización';
    }
    if (this.items.length === 0) {
      this.errores['productos'] = 'Agregue al menos un producto';
    } else if (this.items.some(i => this.itemInvalido(i))) {
      this.errores['productos'] = 'Las cantidades deben ser enteros mayores a 0 y los precios mayores a 0';
    }
    return Object.keys(this.errores).length === 0;
  }

  registrar(): void {
    this.errorGeneral = '';
    if (!this.validar()) {
      this.errorGeneral = 'Revise los campos marcados';
      return;
    }

    this.guardando = true;
    this.cotizacionService.crear({
      fechaCotizacion: this.fechaCotizacion,
      fechaVigencia: this.fechaVigencia,
      proveedor: { idProveedor: this.proveedor!.idProveedor },
      solicitudCompra: this.idSolicitud && this.mensajeSolicitud ? { idSolicitudCompra: this.idSolicitud } : undefined,
      detalleCotizacion: this.items.map(i => ({
        producto: { idProducto: i.producto.idProducto! },
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario
      }))
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/compras/cotizaciones']);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.errorGeneral = mensajeError(err, 'No se pudo registrar la cotización');
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/compras/cotizaciones']);
  }
}
