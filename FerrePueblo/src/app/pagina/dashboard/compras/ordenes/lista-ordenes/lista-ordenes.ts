import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { OrdenCompraResponse } from '../../../../../models/Cotizacion';
import { OrdenService } from '../../../../../services/orden.service';
import { mensajeError } from '../../../../../utils/errores';

/** RF05: órdenes de compra con su estado, aprobador y fecha de aprobación. */
@Component({
  selector: 'app-lista-ordenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-ordenes.html',
})
export class ListaOrdenes implements OnInit {
  ordenes: OrdenCompraResponse[] = [];
  error = '';

  constructor(
    private ordenService: OrdenService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ordenService.listar().subscribe({
      next: (data) => {
        this.ordenes = data;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = mensajeError(err, 'No se pudieron cargar las órdenes de compra');
        this.cdr.detectChanges();
      }
    });
  }

  verDetalle(id: number): void {
    this.router.navigate(['/dashboard/compras/ordenes/detalle', id]);
  }
}
