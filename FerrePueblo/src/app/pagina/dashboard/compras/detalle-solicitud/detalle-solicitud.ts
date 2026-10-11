import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DetalleSolicitudResponse } from '../../../../models/DetalleSolicitudResponse';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SolicitudService } from '../../../../services/solicitud.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-detalle-solicitud',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './detalle-solicitud.html',
  styleUrl: './detalle-solicitud.css',
})
export class DetalleSolicitud implements OnInit{
  solicitud: DetalleSolicitudResponse | null = null;
  id: number = 0;
  subtotal: number = 0;   
  igv: number = 0;        
  totalPagar: number = 0; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitudService: SolicitudService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // La solicitud solo indica qué se necesita; el siguiente paso es cotizarla
  get puedeCotizar(): boolean {
    return this.authService.tienePermiso('crear_cotizaciones');
  }

  ngOnInit(): void {
    // Obtener el ID de la URL
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ID de solicitud:', this.id);
    
    if (this.id > 0) {
      this.cargarDetalle();
    } else {
      console.error('ID no válido');
      alert('ID de solicitud no válido');
      this.router.navigate(['/dashboard/compras']);
    }
  }

  cargarDetalle(): void {
    console.log('Cargando detalle para ID:', this.id);
    
    this.solicitudService.buscar(this.id).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', data);
        this.solicitud = data;
        
        // Calcular subtotal (suma de productos sin IGV)
        if (data.detalleSolicitud && data.detalleSolicitud.length > 0) {
          this.totalPagar = data.detalleSolicitud.reduce((sum, item) => sum + item.subtotal, 0);
          this.totalPagar = Math.round(this.totalPagar * 100) / 100;

          this.subtotal = Math.round((this.totalPagar / 1.18) * 100) / 100;
          this.igv = Math.round((this.totalPagar - this.subtotal) * 100) / 100;
          
          console.log('Subtotal:', this.subtotal);
          console.log('IGV:', this.igv);
          console.log('Total a pagar:', this.totalPagar);
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        alert('Error al cargar el detalle de la solicitud');
        this.router.navigate(['/dashboard/compras']);
      }
    });
  }

  registrarCotizacion(): void {
    this.router.navigate(['/dashboard/compras/cotizaciones/nuevo'], {
      queryParams: { solicitud: this.id }
    });
  }

  salir(): void {
    this.router.navigate(['/dashboard/compras']);
  }
}
