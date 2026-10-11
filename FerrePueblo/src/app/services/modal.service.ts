import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalData {
  titulo: string;
  mensaje: string;
  onConfirm: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private modalSubject = new BehaviorSubject<ModalData | null>(null);
  
  modal$ = this.modalSubject.asObservable();

  get modalValue(): ModalData | null {
    return this.modalSubject.value;
  }

  mostrarModal(titulo: string, mensaje: string, onConfirm: () => void): void {
    this.modalSubject.next({ titulo, mensaje, onConfirm });
  }

  cerrarModal(): void {
    this.modalSubject.next(null);
  }
}