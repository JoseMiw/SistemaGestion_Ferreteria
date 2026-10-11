import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal-confirmacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-confirmacion.html',
  styleUrl: './modal-confirmacion.css',
})
export class ModalConfirmacion {
  constructor(public modalService: ModalService) {}

  confirmar(): void {
    // ✅ Usar el método getter en lugar de .value
    const modal = this.modalService.modalValue;
    if (modal) {
      modal.onConfirm();
      this.modalService.cerrarModal();
    }
  }

  cancelar(): void {
    this.modalService.cerrarModal();
  }
}
