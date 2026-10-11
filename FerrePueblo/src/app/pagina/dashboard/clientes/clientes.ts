import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClienteResponse } from '../../../models/ClienteResponse';
import { ClienteService } from '../../../services/cliente.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {

  dniCliente: string = '';
  mensajeBusqueda: string = '';
  clientes: ClienteResponse[] = [];

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  editar(id: number | undefined): void {
    if (!id) return;
    this.router.navigate(['/dashboard/clientes/editar', id]);
  }

  eliminar(id: number | undefined): void {
    if (!id) return;

    const cliente = this.clientes.find(c => c.idCliente === id);
    const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'este cliente';

    this.modalService.mostrarModal(
      '¿Eliminar cliente?',
      `¿Estás seguro de que deseas eliminar a "${nombreCliente}"? Esta acción no se puede deshacer.`,
      () => {
        this.clienteService.eliminar(id).subscribe({
          next: () => {
            console.log('✅ Cliente eliminado');
            this.clientes = this.clientes.filter(c => c.idCliente !== id);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('❌ Error al eliminar cliente:', err);
            alert(err.error?.message || 'Error al eliminar el cliente');
          }
        });
      }
    );
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }

  buscarCliente(): void {
    const dni = this.dniCliente.trim();
    this.mensajeBusqueda = '';

    if (!/^\d{8}$/.test(dni)) {
      this.mensajeBusqueda = 'Ingrese un DNI válido de 8 dígitos';
      this.clientes = [];
      this.cdr.detectChanges();
      return;
    }

    // Limpiar tabla antes de buscar
    this.clientes = [];
    this.cdr.detectChanges();

    this.clienteService.buscarPorDni(dni).subscribe({
      next: (data: ClienteResponse) => {
        this.clientes = [data];
        this.cdr.detectChanges();  // ← Forzar actualización después de recibir datos
      },
      error: (err: any) => {
        console.error('Error al buscar cliente:', err);
        this.clientes = [];
        this.mensajeBusqueda = err.status === 404
          ? `No hay ningún cliente registrado con el DNI ${dni}`
          : (err.error?.message || 'Error al buscar el cliente');
        this.cdr.detectChanges();  // ← Forzar actualización en caso de error
      }
    });
  }

  nuevoCliente(): void {
    // Navegar sin parámetro (origen vacío)
    this.router.navigate(['/dashboard/clientes/nuevo']);
  }

  aceptar(): void {
    this.router.navigate(['/dashboard']);
  }

  cerrar(): void {
    this.router.navigate(['/dashboard']);
  }
}