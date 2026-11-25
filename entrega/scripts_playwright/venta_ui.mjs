// Registrar una venta por la interfaz (usado en CP06, CP10 y CP11)
import { APP } from './comun.mjs';

export async function abrirNuevaVenta(page) {
  await page.goto(APP + '/dashboard/ventas');
  await page.getByRole('button', { name: 'Registrar Venta' }).click();
  await page.waitForSelector('#venta-cliente');
}

export async function seleccionarCliente(page, dni) {
  await page.fill('#venta-cliente', dni);
  await page.locator('#venta-cliente ~ button, button:has-text("Buscar")').first().click();
  await page.waitForFunction(() => document.querySelector('#venta-cliente-nombre').value.length > 0);
}

export async function agregarProducto(page, nombre, cantidad) {
  await page.fill('#venta-producto', nombre);
  await page.waitForSelector('.sugerencia-item');
  await page.locator('.sugerencia-item').first().dispatchEvent('mousedown');
  await page.waitForSelector('#venta-cantidad');
  await page.fill('#venta-cantidad', String(cantidad));
  await page.locator('.alert button:has-text("Agregar producto")').click();
  await page.waitForTimeout(300);
}

export async function confirmarVenta(page) {
  await page.locator('button.btn-lg:has-text("Registrar Venta")').click();
  await page.waitForTimeout(1500);
}
