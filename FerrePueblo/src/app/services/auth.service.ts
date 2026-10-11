import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LoginResponse, Usuario } from '../models/Usuario';

export type { Usuario } from '../models/Usuario';

/**
 * Autenticación contra el backend (RF08, RF09, RNF01).
 * El backend valida usuario/contraseña (cifrada con BCrypt), bloquea la cuenta
 * tras 5 intentos fallidos y devuelve un token JWT que se envía en cada petición.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api/auth';

  private usuarioActual = signal<Usuario | null>(null);

  // Permisos por rol; deben coincidir con SecurityConfig.java del backend
  private static readonly PERMISOS: { [rol: string]: string[] } = {
    'GERENTE': ['ver_productos', 'crear_productos', 'editar_productos', 'eliminar_productos',
                'ver_alertas_stock',
                'ver_ventas', 'crear_ventas', 'ver_detalle_ventas', 'eliminar_ventas', 'registrar_devoluciones',
                'ver_compras', 'crear_compras', 'ver_detalle_compras', 'eliminar_compras',
                'ver_cotizaciones', 'crear_cotizaciones',
                'ver_ordenes', 'crear_ordenes', 'aprobar_ordenes', 'registrar_entregas',
                'ver_clientes', 'buscar_clientes', 'crear_clientes', 'editar_clientes', 'eliminar_clientes'],
    'ADMINISTRADOR': ['ver_productos', 'crear_productos', 'editar_productos', 'eliminar_productos',
                      'ver_alertas_stock',
                      'ver_ventas', 'crear_ventas', 'ver_detalle_ventas', 'eliminar_ventas', 'registrar_devoluciones',
                      'ver_compras', 'crear_compras', 'ver_detalle_compras', 'eliminar_compras',
                      'ver_cotizaciones', 'crear_cotizaciones',
                      'ver_ordenes', 'crear_ordenes', 'registrar_entregas',
                      'ver_clientes', 'buscar_clientes', 'crear_clientes', 'editar_clientes', 'eliminar_clientes'],
    'VENDEDOR': ['ver_productos',
                 'ver_ventas', 'crear_ventas', 'ver_detalle_ventas', 'eliminar_ventas', 'registrar_devoluciones',
                 'ver_clientes', 'buscar_clientes', 'crear_clientes', 'editar_clientes'],
    'ASISTENTE_COMPRA': ['ver_productos',
                         'ver_compras', 'crear_compras', 'ver_detalle_compras', 'eliminar_compras',
                         'ver_cotizaciones', 'crear_cotizaciones',
                         'ver_ordenes', 'registrar_entregas'],
    'ALMACENERO': ['ver_productos', 'ver_alertas_stock',
                   'ver_compras', 'ver_detalle_compras', 'ver_ordenes', 'registrar_entregas']
  };

  constructor(private http: HttpClient) {
    const session = sessionStorage.getItem('usuarioActual');
    if (session && this.tokenVigente()) {
      this.usuarioActual.set(JSON.parse(session));
    } else {
      this.limpiarSesion();
    }
    // Ya no se guardan usuarios ni contraseñas en el navegador
    localStorage.removeItem('usuarios');
  }

  login(username: string, password: string): Observable<Usuario> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      nombreUsuario: username,
      contraseña: password
    }).pipe(
      map(respuesta => {
        sessionStorage.setItem('token', respuesta.token);
        sessionStorage.setItem('usuarioActual', JSON.stringify(respuesta.usuario));
        sessionStorage.setItem('idUsuario', String(respuesta.usuario.idUsuario));
        this.usuarioActual.set(respuesta.usuario);
        return respuesta.usuario;
      })
    );
  }

  logout(): void {
    this.limpiarSesion();
  }

  // Cambia la contraseña validando la actual y la política en el backend (RF09)
  cambiarPassword(username: string, passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/cambiar-password`, {
      nombreUsuario: username,
      contraseñaActual: passwordActual,
      contraseñaNueva: passwordNueva
    });
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // ✅ MÉTODO PARA OBTENER EL USUARIO ACTUAL
  getUsuarioActual(): Usuario | null {
    if (this.usuarioActual() && !this.tokenVigente()) {
      this.limpiarSesion();
    }
    return this.usuarioActual();
  }

  getRol(): string | null {
    return this.usuarioActual()?.rol || null;
  }

  getIdUsuario(): number {
    return parseInt(sessionStorage.getItem('idUsuario') || '0');
  }

  // ✅ MÉTODO PARA VERIFICAR PERMISOS
  tienePermiso(permiso: string): boolean {
    const usuario = this.getUsuarioActual();
    if (!usuario) return false;
    return AuthService.PERMISOS[usuario.rol]?.includes(permiso) || false;
  }

  hasRole(role: string): boolean {
    return this.getRol() === role;
  }

  isAuthenticated(): boolean {
    return this.getUsuarioActual() !== null;
  }

  getUsername(): string {
    return this.usuarioActual()?.nombreUsuario || '';
  }

  getRoles(): string[] {
    const usuario = this.usuarioActual();
    return usuario ? [usuario.rol] : [];
  }

  private limpiarSesion(): void {
    this.usuarioActual.set(null);
    sessionStorage.removeItem('usuarioActual');
    sessionStorage.removeItem('idUsuario');
    sessionStorage.removeItem('token');
  }

  // Lee la fecha de expiración del JWT (sin validar la firma; eso lo hace el backend)
  private tokenVigente(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
