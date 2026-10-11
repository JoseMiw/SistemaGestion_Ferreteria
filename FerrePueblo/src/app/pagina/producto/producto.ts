import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

interface ProductoCatalogo {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  resenas: number;
}

@Component({
  selector: 'app-producto',
  imports: [DecimalPipe],
  templateUrl: './producto.html',
  styleUrl: './producto.css',
})
export class Producto {

  private route = inject(ActivatedRoute);

  readonly catalogo: ProductoCatalogo[] = [
    { nombre: 'Alicate Universal', descripcion: 'Ideal para trabajos de sujeción, agarre y corte.', precio: 15.00, imagen: '/img/h1.jpg', resenas: 128 },
    { nombre: 'Alicate de Corte', descripcion: 'Cortes precisos y limpios en cables y alambres.', precio: 20.00, imagen: '/img/h2.jpg', resenas: 96 },
    { nombre: 'Alicate Profesional', descripcion: 'Alta resistencia y durabilidad para uso profesional.', precio: 25.00, imagen: '/img/h3.jpg', resenas: 87 },
    { nombre: 'Martillo Profesional', descripcion: 'Cabeza de acero forjado y mango antideslizante.', precio: 18.90, imagen: '/img/h4.jpg', resenas: 74 },
    { nombre: 'Clavos de Acero', descripcion: 'Clavos resistentes para trabajos de construcción.', precio: 8.50, imagen: '/img/clavos.jpg', resenas: 112 },
    { nombre: 'Sierra Manual', descripcion: 'Cortes rápidos y precisos en madera y otros materiales.', precio: 35.90, imagen: '/img/sierra.jpg', resenas: 59 },
    { nombre: 'Taladro Percutor', descripcion: 'Potente y ergonómico, ideal para perforaciones.', precio: 189.90, imagen: '/img/taladro.jpg', resenas: 203 },
    { nombre: 'Tuercas Hexagonales', descripcion: 'Tuercas de alta calidad para fijaciones seguras.', precio: 12.90, imagen: '/img/tuercas.jpg', resenas: 97 },
    { nombre: 'Broca para Concreto', descripcion: 'Ideal para perforaciones en concreto y ladrillo.', precio: 9.90, imagen: '/img/BrocaConcreto.jpg', resenas: 85 },
    { nombre: 'Broca para Metal', descripcion: 'Broca de acero para perforaciones precisas en metal.', precio: 8.90, imagen: '/img/BrocaMetal.png', resenas: 102 },
    { nombre: 'Candado de Seguridad', descripcion: 'Candado resistente con llave para mayor seguridad.', precio: 29.90, imagen: '/img/Candado.jpg', resenas: 76 },
    { nombre: 'Cutter Profesional', descripcion: 'Cuchilla retráctil ideal para cortes de precisión.', precio: 14.90, imagen: '/img/Cutter.jpg', resenas: 91 },
    { nombre: 'Destornillador Phillips', descripcion: 'Ideal para tornillos de cabeza en cruz.', precio: 12.90, imagen: '/img/DestornilladorPhillips.jpg', resenas: 134 },
    { nombre: 'Destornillador Plano', descripcion: 'Herramienta práctica para tornillos de ranura recta.', precio: 10.90, imagen: '/img/DestornilladorPlano.jpg', resenas: 98 },
    { nombre: 'Disco de Corte', descripcion: 'Disco resistente para cortes en metal y acero.', precio: 11.50, imagen: '/img/DiscoCorte.jpg', resenas: 143 },
    { nombre: 'Flexómetro 5 m', descripcion: 'Cinta métrica resistente y precisa para cualquier trabajo.', precio: 18.50, imagen: '/img/Flexómetro.jpg', resenas: 187 },
    { nombre: 'Llave Inglesa Ajustable', descripcion: 'Ajustable para distintos tamaños de tuercas y pernos.', precio: 39.90, imagen: '/img/LlaveInglesa.jpg', resenas: 109 },
    { nombre: 'Nivel de Burbuja', descripcion: 'Garantiza mediciones horizontales y verticales precisas.', precio: 24.90, imagen: '/img/NivelBurbuja.jpg', resenas: 84 },
    { nombre: 'Pistola de Silicona', descripcion: 'Ideal para trabajos de pegado y manualidades.', precio: 22.90, imagen: '/img/PistolaSilicona.png', resenas: 116 },
    { nombre: 'Arandelas Galvanizadas', descripcion: 'Ideales para distribuir la presión en uniones atornilladas.', precio: 6.90, imagen: '/img/Arandelas.jpg', resenas: 79 },
  ];

  // Texto de búsqueda que llega desde el buscador del header (?buscar=...)
  readonly termino = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('buscar') ?? '')),
    { initialValue: '' }
  );

  readonly productosFiltrados = computed(() => {
    const texto = this.normalizar(this.termino());
    if (!texto) return this.catalogo;
    return this.catalogo.filter(p => this.normalizar(p.nombre).includes(texto));
  });

  // Minúsculas y sin tildes, para que "flexometro" encuentre "Flexómetro"
  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
