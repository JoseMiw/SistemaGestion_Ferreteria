import { Component ,ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ProductoService } from '../../../services/producto.service';
import { ActivatedRoute } from '@angular/router';
import { OnInit } from '@angular/core';
import { ProductoResponse } from '../../../models/ProductoResponse';
import { erroresPorCampo, mensajeError } from '../../../utils/errores';


@Component({
  selector: 'app-formulario-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formulario-producto.html',
  styleUrl: './formulario-producto.css',
})
export class FormularioProducto implements OnInit{

  producto:ProductoResponse={
    //idProducto: 0,
    codigo: '',
    nombre: '',
    stock: 0,
    stockMinimo: 5,
    precioVenta: 0,
    precioCompra: 0,
    descripcion: '',
    estado: 'ACTIVO'
  };


  id?:number;
  esEditar=false;
  guardando = false;
  errorGeneral = '';
  erroresBackend: { [campo: string]: string } = {};

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  guardar(form: any) {
    this.errorGeneral = '';
    this.erroresBackend = {};

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorGeneral = 'Revise los campos marcados';
      return;
    }

    this.guardando = true;
    const { estadoStock, ...datos } = this.producto;
    const peticion = this.esEditar
      ? this.productoService.actualizar(this.id!, datos as ProductoResponse)
      : this.productoService.crear(datos as ProductoResponse);

    peticion.subscribe({
      next: () => {
        this.router.navigate(['/dashboard/productos']);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.erroresBackend = erroresPorCampo(err);
        this.errorGeneral = mensajeError(err, 'No se pudo guardar el producto');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
     const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.esEditar = true;

      this.productoService.buscar(this.id).subscribe({
        next: (data) => {
          const estadoNormalizado = data.estado ? data.estado.toUpperCase() : 'ACTIVO';

          this.producto = {
            ...data,
            estado: estadoNormalizado
          };

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log(err);
          alert('Error al cargar el producto');
        }
      });
    }
  }
}
