import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-inicio-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-dashboard.html',
  styleUrl: './inicio-dashboard.css',
})
export class InicioDashboard implements OnInit{
  mensajeRestriccion: string = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si hay error de permiso
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'no_permiso') {
        this.mensajeRestriccion = '⚠️ No tiene permisos para acceder a esta sección.';
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
          this.mensajeRestriccion = '';
        }, 5000);
      }
    });
  }

  get usuarioActual() {
    return this.authService.getUsuarioActual();
  }
}
