import { HttpErrorResponse } from '@angular/common/http';

/** Mensaje legible de un error del backend ({ message, errores }). */
export function mensajeError(err: HttpErrorResponse, porDefecto: string): string {
  if (err?.status === 0) {
    return 'No se pudo conectar con el servidor';
  }
  if (err?.status === 403) {
    return 'No tiene permisos para realizar esta acción';
  }
  return err?.error?.message || porDefecto;
}

/** Errores por campo que devuelve el backend: { campo: mensaje }. */
export function erroresPorCampo(err: HttpErrorResponse): { [campo: string]: string } {
  return err?.error?.errores || {};
}

/** Fecha local (no UTC) en formato yyyy-MM-dd. */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
