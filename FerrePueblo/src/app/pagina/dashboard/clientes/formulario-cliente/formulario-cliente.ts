import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../../../services/cliente.service';  // ← Cambiado
import { ClienteResponse } from '../../../../models/ClienteResponse';    // ← Cambiado
import { HttpErrorResponse } from '@angular/common/http';
import { erroresPorCampo, mensajeError } from '../../../../utils/errores';

@Component({
  selector: 'app-formulario-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formulario-cliente.html',
  styleUrl: './formulario-cliente.css',
})
export class FormularioCliente {

  cliente: ClienteResponse = {
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: ''
  };

  origen: string = '';
  id?: number;
  esEditar = false;
  errorGeneral = '';
  erroresBackend: { [campo: string]: string } = {};

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener el parámetro 'origen' de la URL
    this.route.queryParams.subscribe(params => {
      this.origen = params['origen'] || '';
      console.log('Origen:', this.origen);
    });

    // Si la ruta trae :id, estamos editando
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.esEditar = true;

      this.clienteService.buscar(this.id).subscribe({
        next: (data) => {
          this.cliente = { ...data };
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar cliente:', err);
          alert('Error al cargar el cliente');
          this.router.navigate(['/dashboard/clientes']);
        }
      });
    }
  }

  guardar(form: any): void {
    this.errorGeneral = '';
    this.erroresBackend = {};

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorGeneral = 'Revise los campos marcados';
      return;
    }

    const peticion = this.esEditar
      ? this.clienteService.actualizar(this.id!, this.cliente)
      : this.clienteService.crear(this.cliente);

    peticion.subscribe({
      next: (response: ClienteResponse) => {
        console.log(this.esEditar ? 'Cliente actualizado:' : 'Cliente creado:', response);
        this.volver(response.dni);
      },
      error: (err: HttpErrorResponse) => {
        // Documento inválido, duplicado o campo obligatorio vacío (CA14)
        this.erroresBackend = erroresPorCampo(err);
        this.errorGeneral = mensajeError(err,
          this.esEditar ? 'Error al actualizar el cliente' : 'Error al registrar el cliente');
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(): void {
    this.volver();
  }

  private volver(dniGuardado?: string): void {
    // Si viene desde ventas, volver a ventas con el DNI del cliente recién registrado
    if (this.origen === 'venta') {
      this.router.navigate(['/dashboard/ventas/nuevo'], {
        queryParams: dniGuardado ? { dni: dniGuardado } : {}
      });
    } else {
      // Si no, volver a clientes
      this.router.navigate(['/dashboard/clientes']);
    }
  }
}
