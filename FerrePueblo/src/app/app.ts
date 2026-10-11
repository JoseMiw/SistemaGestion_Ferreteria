import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./layout/header/header";
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ModalConfirmacion } from './shared/modal-confirmacion/modal-confirmacion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, HttpClientModule, FormsModule, ModalConfirmacion],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FerrePueblo');
}
