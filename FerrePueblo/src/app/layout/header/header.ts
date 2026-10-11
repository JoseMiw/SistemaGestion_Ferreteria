import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {

  mostrarLogin = false;
  mostrarCambioPassword = false;

  // Login
  usuario: string = '';
  password: string = '';
  errorMessage: string = '';
  mostrarPassword: boolean = false;
  cargandoLogin = false;

  // Cambio de contraseña
  usuarioCambio: string = '';
  passwordActual: string = '';
  passwordNueva: string = '';
  confirmarPassword: string = '';
  errorCambio: string = '';
  exitoCambio: string = '';
  cargandoCambio = false;

  // Buscador
  busqueda: string = '';

  @ViewChild('campoUsuario') campoUsuario?: ElementRef<HTMLInputElement>;
  @ViewChild('campoUsuarioCambio') campoUsuarioCambio?: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Limpiar el buscador al salir de la página de productos
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        if (!(e as NavigationEnd).urlAfterRedirects.startsWith('/producto')) {
          this.busqueda = '';
        }
      });
  }

  // Filtra el catálogo mientras se escribe (la página Productos lee ?buscar=)
  buscarProducto(): void {
    const texto = this.busqueda.trim();
    this.router.navigate(['/producto'], {
      queryParams: { buscar: texto || null },
      replaceUrl: this.router.url.startsWith('/producto')
    });
  }

  get usuarioActual(): Usuario | null {
    return this.authService.getUsuarioActual();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get username(): string {
    return this.authService.getUsername();
  }

  get roles(): string[] {
    return this.authService.getRoles();
  }

  abrirLogin(): void {
    this.mostrarLogin = true;
    this.errorMessage = '';
    this.enfocar(() => this.campoUsuario);
  }

  cerrarLogin(): void {
    this.mostrarLogin = false;
    this.usuario = '';
    this.password = '';
    this.errorMessage = '';
  }

  validarLogin(): void {
    if (!this.usuario.trim() || !this.password) {
      this.errorMessage = 'Ingrese su usuario y contraseña';
      return;
    }

    this.cargandoLogin = true;
    this.errorMessage = '';

    this.authService.login(this.usuario.trim(), this.password).subscribe({
      next: () => {
        this.cargandoLogin = false;
        this.cerrarLogin();
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoLogin = false;
        this.password = '';
        this.errorMessage = this.mensajeDeError(err, 'Usuario o contraseña incorrectos');
        this.cdr.detectChanges();
      }
    });
  }

  olvidoPassword(): void {
    this.usuarioCambio = this.usuario;
    this.mostrarLogin = false;
    this.mostrarCambioPassword = true;
    this.errorCambio = '';
    this.exitoCambio = '';
    this.enfocar(() => this.campoUsuarioCambio);
  }

  cerrarCambioPassword(): void {
    this.mostrarCambioPassword = false;
    this.usuarioCambio = '';
    this.passwordActual = '';
    this.passwordNueva = '';
    this.confirmarPassword = '';
    this.errorCambio = '';
    this.exitoCambio = '';
  }

  // RF09: la contraseña actual y la política se validan en el backend
  cambiarPassword(): void {
    this.errorCambio = '';
    this.exitoCambio = '';

    if (!this.usuarioCambio.trim() || !this.passwordActual) {
      this.errorCambio = 'Ingrese su usuario y su contraseña actual';
      return;
    }

    if (this.passwordNueva.trim() === '') {
      this.errorCambio = 'Ingrese una nueva contraseña';
      return;
    }

    if (this.passwordNueva !== this.confirmarPassword) {
      this.errorCambio = 'Las contraseñas nuevas no coinciden';
      return;
    }

    this.cargandoCambio = true;
    this.authService.cambiarPassword(this.usuarioCambio.trim(), this.passwordActual, this.passwordNueva).subscribe({
      next: (respuesta) => {
        this.cargandoCambio = false;
        this.passwordActual = '';
        this.passwordNueva = '';
        this.confirmarPassword = '';
        this.exitoCambio = respuesta.message || 'Contraseña cambiada correctamente';
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoCambio = false;
        this.errorCambio = this.mensajeDeError(err, 'No se pudo cambiar la contraseña');
        this.cdr.detectChanges();
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/inicio']);
  }

  togglePassword(): void {
  this.mostrarPassword = !this.mostrarPassword;
  }

  private mensajeDeError(err: HttpErrorResponse, porDefecto: string): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor';
    }
    return err.error?.message || porDefecto;
  }

  // Lleva el foco al primer campo del modal al abrirlo (navegación por teclado)
  private enfocar(campo: () => ElementRef<HTMLInputElement> | undefined): void {
    setTimeout(() => campo()?.nativeElement.focus());
  }
}
