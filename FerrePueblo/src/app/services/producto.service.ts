import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoResponse } from '../models/ProductoResponse';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient) {}


  listar(): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(this.apiUrl);
  }

  crear(producto: ProductoResponse): Observable<ProductoResponse> {
    return this.http.post<ProductoResponse>(this.apiUrl, producto);
  }

  buscar(id: number): Observable<ProductoResponse> {
    return this.http.get<ProductoResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  actualizar(
    id: number,
    producto: ProductoResponse
  ): Observable<ProductoResponse> {

    return this.http.put<ProductoResponse>(
      `${this.apiUrl}/${id}`,
      producto
    );
  }

  eliminar(id:number): Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(`${this.apiUrl}/buscar`, { params: { nombre } });
  }

  // RF01: productos con stock igual o inferior al mínimo
  listarStockBajo(): Observable<ProductoResponse[]> {
    return this.http.get<ProductoResponse[]>(`${this.apiUrl}/stock-bajo`);
  }

}