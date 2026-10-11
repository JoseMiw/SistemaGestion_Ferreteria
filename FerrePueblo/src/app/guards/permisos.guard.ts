import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermisosGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const permiso = route.data['permiso'] as string;
    const tienePermiso = this.authService.tienePermiso(permiso);

    if (tienePermiso) {
      return true;
    }

    // Redirigir al dashboard con mensaje de restricción
    this.router.navigate(['/dashboard'], { 
      queryParams: { error: 'no_permiso' } 
    });
    return false;
  }
}