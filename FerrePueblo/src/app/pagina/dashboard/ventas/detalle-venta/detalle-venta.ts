import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DetalleVentaResponse } from '../../../../models/DetalleVentaResponse';
import { VentaService } from '../../../../services/venta.service';

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-venta.html',
  styleUrl: './detalle-venta.css',
})
export class DetalleVenta implements OnInit{
  venta: DetalleVentaResponse | null = null;
  id: number = 0;
  subtotal: number = 0;
  igv: number = 0;
  totalPagar: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ventaService: VentaService,
    private cdr: ChangeDetectorRef  
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID de venta:', this.id);
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    console.log('Cargando detalle para ID:', this.id);
    
    this.ventaService.buscar(this.id).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        this.venta = data;
        
        // Calcular totales
        if (data.detalleVenta && data.detalleVenta.length > 0) {
          this.totalPagar = data.detalleVenta.reduce((sum, item) => sum + item.subtotal, 0);
          this.totalPagar = Math.round(this.totalPagar * 100) / 100;

          this.subtotal = Math.round((this.totalPagar / 1.18) * 100) / 100;
          this.igv = Math.round((this.totalPagar - this.subtotal) * 100) / 100;
          
          console.log('Subtotal:', this.subtotal);
          console.log('IGV:', this.igv);
          console.log('Total a pagar:', this.totalPagar);
        }
        
        this.cdr.detectChanges();
        console.log('Vista actualizada');
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        alert('Error al cargar el detalle de la venta');
        this.router.navigate(['/dashboard/ventas']);
      }
    });
  }

  salir(): void {
    this.router.navigate(['/dashboard/ventas']);
  }
}
