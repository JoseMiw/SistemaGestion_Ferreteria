import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Agrega el token JWT a cada petición al backend. Si el backend responde 401
 * (token vencido o inválido), cierra la sesión y vuelve al inicio.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const esAuth = req.url.includes('/api/auth/');

  const peticion = token && !esAuth
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esAuth) {
        authService.logout();
        router.navigate(['/inicio']);
      }
      return throwError(() => error);
    })
  );
};
