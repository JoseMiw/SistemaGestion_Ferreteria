import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { VentaResponse } from '../../../../models/VentaResponse';
import { VentaService } from '../../../../services/venta.service';
import { AuthService } from '../../../../services/auth.service';
import { ModalService } from '../../../../services/modal.service';

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-ventas.html',
  styleUrl: './lista-ventas.css',
})
export class ListaVentas implements OnInit{
  ventas: VentaResponse[] = [];

  constructor(
    private ventaService: VentaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.ventaService.listar().subscribe({
      next: (data) => {
        this.ventas = data;
        this.cdr.detectChanges();
        console.log('Ventas cargadas:', data);
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
      }
    });
  }

  nuevaVenta(): void {
    this.router.navigate(['/dashboard/ventas/nuevo']);
  }

  verDetalle(id: number | undefined): void {
    if (id) {
       this.router.navigate(['/dashboard/ventas/detalle', id]);
    }
  }

  eliminar(id: number | undefined): void {
    if (!id) return;
    
    this.modalService.mostrarModal(
      '¿Eliminar venta?',
      `¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.`,
      () => {
        this.ventaService.eliminar(id).subscribe({
          next: () => {
            console.log('✅ Venta eliminada');
            this.cargarVentas();
          },
          error: (err) => {
            console.error('❌ Error al eliminar venta:', err);
            alert(err.error?.message || 'Error al eliminar la venta');
          }
        });
      }
    );
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }

  registrarDevolucion(): void {
    this.router.navigate(['/dashboard/ventas/devolucion/nuevo']);
  }
}
