import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { OrdenService } from '../../../../services/orden.service';
import { EntregaService } from '../../../../services/entrega.service';
import { OrdenCompraResponse } from '../../../../models/Cotizacion';
import { ProductoResponse } from '../../../../models/ProductoResponse';
import { mensajeError } from '../../../../utils/errores';

interface DetalleEntrega {
  producto: ProductoResponse;
  cantidadSolicitada: number;
  cantidadRecibida: number;
  costoUnitario: number;
  subtotal: number;
  estadoProducto: string; // 'BUENO' | 'MALO'
}

/**
 * Registra la mercadería recibida de una orden de compra APROBADA.
 * El backend valida la orden, aumenta el stock y la marca como ENTREGADA
 * en una sola transacción (RNF04).
 */
@Component({
  selector: 'app-registrar-entrega',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-entrega.html',
  styleUrl: './registrar-entrega.css',
})
export class RegistrarEntrega implements OnInit{

  idOrdenCompra: number | null = null;
  orden: OrdenCompraResponse | null = null;
  mensajeErrorOrden: string = '';
  cargando: boolean = false;
  guardando: boolean = false;
  errorRegistro: string = '';

  productos: DetalleEntrega[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ordenService: OrdenService,
    private entregaService: EntregaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Viene desde el detalle de la orden: /entrega/nuevo?orden=N
    const orden = Number(this.route.snapshot.queryParamMap.get('orden'));
    if (orden > 0) {
      this.idOrdenCompra = orden;
      this.buscarOrden();
    }
  }

  // ============================================
  // BUSCAR ORDEN DE COMPRA
  // ============================================

  buscarOrden(): void {
    this.orden = null;
    this.productos = [];
    this.errorRegistro = '';

    if (!this.idOrdenCompra || this.idOrdenCompra <= 0) {
      this.mensajeErrorOrden = 'Ingrese un número de orden válido';
      return;
    }

    this.cargando = true;
    this.mensajeErrorOrden = '';

    this.ordenService.buscar(this.idOrdenCompra).subscribe({
      next: (data) => {
        this.cargando = false;
        if (data.estado !== 'APROBADA') {
          this.mensajeErrorOrden = data.estado === 'ENTREGADA'
            ? `La orden N° ${data.idOrdenCompra} ya fue entregada`
            : `La orden N° ${data.idOrdenCompra} no está aprobada (estado: ${data.estado})`;
          this.cdr.detectChanges();
          return;
        }

        this.orden = data;
        this.productos = data.cotizacion.detalleCotizacion.map(item => ({
          producto: item.producto,
          cantidadSolicitada: item.cantidad,
          cantidadRecibida: item.cantidad,
          costoUnitario: item.precioUnitario,
          subtotal: item.subtotal,
          estadoProducto: 'BUENO'
        }));
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeErrorOrden = err.status === 404
          ? 'Orden de compra no encontrada. Verifique el número.'
          : mensajeError(err, 'Error al buscar la orden de compra');
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================
  // CALCULAR TOTALES
  // ============================================

  get cantidadTotal(): number {
    return this.productos.reduce((sum, item) => sum + (item.cantidadRecibida || 0), 0);
  }

  get subtotalTotal(): number {
    return this.productos.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get costoPromedio(): number {
    if (this.cantidadTotal === 0) return 0;
    return Math.round((this.subtotalTotal / this.cantidadTotal) * 100) / 100;
  }

  actualizarSubtotal(item: DetalleEntrega): void {
    item.subtotal = Math.round((item.cantidadRecibida || 0) * item.costoUnitario * 100) / 100;
  }

  cantidadInvalida(item: DetalleEntrega): boolean {
    return !Number.isInteger(item.cantidadRecibida) || item.cantidadRecibida < 1 || item.cantidadRecibida > item.cantidadSolicitada;
  }

  // ============================================
  // REGISTRAR ENTREGA
  // ============================================

  registrarEntrega(): void {
    this.errorRegistro = '';
    if (!this.orden) {
      this.errorRegistro = 'Primero busque una orden de compra aprobada';
      return;
    }

    const invalido = this.productos.find(item => this.cantidadInvalida(item));
    if (invalido) {
      this.errorRegistro = `La cantidad recibida de "${invalido.producto.nombre}" debe estar entre 1 y ${invalido.cantidadSolicitada}`;
      return;
    }

    this.guardando = true;
    this.entregaService.crear({
      idOrdenCompra: this.orden.idOrdenCompra,
      detalleGuia: this.productos.map(item => ({
        producto: { idProducto: item.producto.idProducto! },
        cantidad: item.cantidadRecibida,
        costoUnitario: item.costoUnitario
      }))
    }).subscribe({
      next: () => {
        // El stock ya fue actualizado por el backend
        alert('Entrega registrada correctamente. El stock fue actualizado.');
        this.router.navigate(['/dashboard/compras/ordenes']);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.errorRegistro = mensajeError(err, 'Error al registrar la entrega');
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/compras/ordenes']);
  }
}
