import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CotizacionResponse } from '../../../../../models/Cotizacion';
import { CotizacionService } from '../../../../../services/cotizacion.service';
import { OrdenService } from '../../../../../services/orden.service';
import { AuthService } from '../../../../../services/auth.service';
import { ModalService } from '../../../../../services/modal.service';
import { fechaLocalISO, mensajeError } from '../../../../../utils/errores';

/** RF04: cotizaciones registradas; desde aquí el gerente genera la orden (RF05). */
@Component({
  selector: 'app-lista-cotizaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-cotizaciones.html',
})
export class ListaCotizaciones implements OnInit {
  cotizaciones: CotizacionResponse[] = [];
  expandida: number | null = null;
  error = '';
  mensaje = '';
  hoy = fechaLocalISO();

  constructor(
    private cotizacionService: CotizacionService,
    private ordenService: OrdenService,
    private authService: AuthService,
    private modalService: ModalService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cotizacionService.listar().subscribe({
      next: (data) => {
        this.cotizaciones = data;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = mensajeError(err, 'No se pudieron cargar las cotizaciones');
        this.cdr.detectChanges();
      }
    });
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }

  vencida(c: CotizacionResponse): boolean {
    return c.fechaVigencia < this.hoy;
  }

  alternarDetalle(id: number): void {
    this.expandida = this.expandida === id ? null : id;
  }

  nuevaCotizacion(): void {
    this.router.navigate(['/dashboard/compras/cotizaciones/nuevo']);
  }

  generarOrden(c: CotizacionResponse): void {
    this.modalService.mostrarModal(
      '¿Generar orden de compra?',
      `Se creará una orden de compra PENDIENTE desde la cotización N° ${c.idCotizacion} de ${c.proveedor.nombreProveedor} por S/. ${c.montoTotal.toFixed(2)}.`,
      () => {
        this.error = '';
        this.ordenService.crearDesdeCotizacion(c.idCotizacion).subscribe({
          next: (orden) => {
            this.router.navigate(['/dashboard/compras/ordenes/detalle', orden.idOrdenCompra]);
          },
          error: (err: HttpErrorResponse) => {
            this.error = mensajeError(err, 'No se pudo generar la orden');
            this.cdr.detectChanges();
          }
        });
      }
    );
  }
}
