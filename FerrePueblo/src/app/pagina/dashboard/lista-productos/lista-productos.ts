import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductoResponse } from '../../../models/ProductoResponse';
import { ProductoService } from '../../../services/producto.service';
import { AuthService } from '../../../services/auth.service';
import { ModalService } from '../../../services/modal.service';


@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-productos.html',
  styleUrl: './lista-productos.css',
})
export class ListaProductos implements OnInit {

  productos: ProductoResponse[] = [];

  // RF03: buscar un producto por código o nombre
  busqueda: string = '';

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void{
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (data) =>{
        this.productos=data
        console.log('Productos cargados:', this.productos);
        this.cdr.detectChanges();
      },
      error: (err) =>{
        console.error('Error al cargar productos:', err);
      }
    });
  }

  // Filtra por código o nombre, sin distinguir mayúsculas ni tildes
  get productosFiltrados(): ProductoResponse[] {
    const texto = this.normalizar(this.busqueda);
    if (!texto) return this.productos;
    return this.productos.filter(p =>
      this.normalizar(p.codigo).includes(texto) || this.normalizar(p.nombre).includes(texto)
    );
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
  }

  etiquetaEstadoStock(estado?: string): string {
    return estado === 'AGOTADO' ? 'Agotado' : estado === 'BAJO' ? 'Bajo' : 'Normal';
  }

  editar(id: number): void{
    this.router.navigate(['/dashboard/productos/editar', id]);
  }

  eliminar(id:number | undefined): void{
    if (!id) return;

    // Buscar el producto para mostrar su nombre
    const producto = this.productos.find(p => p.idProducto === id);
    const nombreProducto = producto ? producto.nombre : 'este producto';

    this.modalService.mostrarModal(
      '¿Eliminar producto?',
      `¿Estás seguro de que deseas eliminar "${nombreProducto}"? Esta acción no se puede deshacer.`,
      () => {
        this.productoService.eliminar(id).subscribe({
          next: () => {
            console.log('✅ Producto eliminado');
            this.cargarProductos();
          },
          error: (err) => {
            console.error('❌ Error al eliminar producto:', err);
            alert(err.error?.message || 'Error al eliminar el producto');
          }
        });
      }
    );
  }

  tienePermiso(permiso: string): boolean {
  return this.authService.tienePermiso(permiso);
  }

  private normalizar(texto: string | undefined): string {
    return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
