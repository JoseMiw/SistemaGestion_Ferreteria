import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductoResponse } from '../../../../models/ProductoResponse';
import { ProductoService } from '../../../../services/producto.service';
import { mensajeError } from '../../../../utils/errores';

/** RF01: productos con stock igual o inferior al stock mínimo. */
@Component({
  selector: 'app-stock-bajo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-bajo.html',
})
export class StockBajo implements OnInit {
  productos: ProductoResponse[] = [];
  cargando = true;
  error = '';

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.productoService.listarStockBajo().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = mensajeError(err, 'No se pudieron cargar las alertas de stock');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get agotados(): number {
    return this.productos.filter(p => p.estadoStock === 'AGOTADO').length;
  }
}
