import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SolicitudResponse } from '../../../../models/SolicitudResponse';
import { SolicitudService } from '../../../../services/solicitud.service';
import { AuthService } from '../../../../services/auth.service';
import { ModalService } from '../../../../services/modal.service';

@Component({
  selector: 'app-lista-solicitudes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-solicitudes.html',
  styleUrl: './lista-solicitudes.css',
})
export class ListaSolicitudes {
  solicitudes: SolicitudResponse[] = [];

  constructor(
    private solicitudService: SolicitudService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    console.log('=== CARGANDO SOLICITUDES ===');
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.solicitudService.listar().subscribe({
      next: (data) => {
        console.log('Solicitudes recibidas:', data);
        this.solicitudes = data;
        this.cdr.detectChanges();
        console.log('Total de solicitudes:', this.solicitudes.length);
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  nuevaSolicitud(): void {
    this.router.navigate(['/dashboard/compras/nuevo']);
  }

  verDetalle(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/dashboard/compras/detalle', id]);
    }
  }

  eliminar(id: number | undefined): void {
    if (!id) return;
    
    this.modalService.mostrarModal(
      '¿Eliminar solicitud?',
      `¿Estás seguro de que deseas eliminar esta solicitud de compra? Esta acción no se puede deshacer.`,
      () => {
        this.solicitudService.eliminar(id).subscribe({
          next: () => {
            console.log('✅ Solicitud eliminada');
            this.cargarSolicitudes();
          },
          error: (err) => {
            console.error('❌ Error al eliminar solicitud:', err);
            alert(err.error?.message || 'Error al eliminar la solicitud');
          }
        });
      }
    );
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }

}

