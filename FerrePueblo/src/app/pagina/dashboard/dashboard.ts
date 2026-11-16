import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // Modo oscuro: solo dentro del panel; cada usuario guarda su preferencia en este navegador
  modoOscuro = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.modoOscuro = this.leerPreferenciaTema() === 'oscuro';
  }

  private get claveTema(): string | null {
    const usuario = this.usuarioActual;
    return usuario ? `tema_usuario_${usuario.idUsuario}` : null;
  }

  private leerPreferenciaTema(): string | null {
    const clave = this.claveTema;
    if (!clave) return null;
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  alternarTema(): void {
    this.modoOscuro = !this.modoOscuro;
    const clave = this.claveTema;
    if (!clave) return;
    try {
      localStorage.setItem(clave, this.modoOscuro ? 'oscuro' : 'claro');
    } catch {
      // Si el navegador no permite guardar, el cambio dura solo en esta visita
    }
  }

  get usuarioActual() {
    return this.authService.getUsuarioActual();
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.tienePermiso(permiso);
  }

  cerrarSesion(): void {
      this.authService.logout();
      this.router.navigate(['/inicio']);
  }
}
