import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProveedorResponse {
    idProveedor: number;
    ruc: string;
    nombreProveedor: string;
    telefono: string;
    correo: string;
    direccion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private apiUrl = 'http://localhost:8080/api/proveedores';

  constructor(private http: HttpClient) {}

  buscarPorRuc(ruc: string): Observable<ProveedorResponse> {
    return this.http.get<ProveedorResponse>(`${this.apiUrl}/ruc/${ruc}`);
  }
}