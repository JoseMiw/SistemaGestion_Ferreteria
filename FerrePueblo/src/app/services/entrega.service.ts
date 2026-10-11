import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EntregaRequest } from '../models/EntregaRequest';

@Injectable({
  providedIn: 'root'
})
export class EntregaService {

  private apiUrl = 'http://localhost:8080/api/entregas';

  constructor(private http: HttpClient) {}


  crear(entrega: EntregaRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, entrega);
  }
}