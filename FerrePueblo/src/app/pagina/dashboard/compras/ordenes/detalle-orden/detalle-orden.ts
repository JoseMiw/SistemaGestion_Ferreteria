import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenCompraResponse } from '../../../../../models/Cotizacion';
import { OrdenService } from '../../../../../services/orden.service';
import { AuthService } from '../../../../../services/auth.service';
import { ModalService } from '../../../../../services/modal.service';
import { mensajeError } from '../../../../../utils/errores';

/** RF05: detalle de la orden; el gerente la aprueba o rechaza. */
@Component({
  selector: 'app-detalle-orden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-orden.html',
})
export class DetalleOrden implements OnInit {
  orden: OrdenCompraResponse | null = null;
  error = '';
  mensaje = '';
  procesando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordenService: OrdenService,
    private authService: AuthService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ordenService.buscar(id).subscribe({
      next: (data) => {
        this.orden = data;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.status === 404 ? 'Orden de compra no encontrada' : mensajeError(err, 'No se pudo cargar la orden');
        this.cdr.detectChanges();
      }
    });
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }

  aprobar(): void {
    this.confirmarYEjecutar('¿Aprobar la orden de compra?',
      'Quedará registrado que usted la aprobó, con la fecha y hora actuales.', true);
  }

  rechazar(): void {
    this.confirmarYEjecutar('¿Rechazar la orden de compra?',
      'La orden quedará RECHAZADA y no se podrá registrar su entrega.', false);
  }

  registrarEntrega(): void {
    this.router.navigate(['/dashboard/compras/entrega/nuevo'], {
      queryParams: { orden: this.orden?.idOrdenCompra }
    });
  }

  volver(): void {
    this.router.navigate(['/dashboard/compras/ordenes']);
  }

  private confirmarYEjecutar(titulo: string, texto: string, aprobar: boolean): void {
    if (!this.orden) return;
    const id = this.orden.idOrdenCompra;
    this.modalService.mostrarModal(titulo, texto, () => {
      this.procesando = true;
      this.error = '';
      const peticion = aprobar ? this.ordenService.aprobar(id) : this.ordenService.rechazar(id);
      peticion.subscribe({
        next: (data) => {
          this.orden = data;
          this.procesando = false;
          this.mensaje = aprobar ? 'Orden aprobada correctamente' : 'Orden rechazada';
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.procesando = false;
          this.error = mensajeError(err, 'No se pudo procesar la orden');
          this.cdr.detectChanges();
        }
      });
    });
  }
}
