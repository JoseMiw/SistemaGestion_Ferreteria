// CP10 – RF10: devolución ligada a la venta y reposición de stock
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';
import { abrirNuevaVenta, seleccionarCliente, agregarProducto, confirmarVenta } from './venta_ui.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const stock = async () => (await consulta("SELECT stock FROM producto WHERE codigo = 'PRD-0001'"))[0].stock;
const devolucionesDe = async (idVenta) => consulta('SELECT d.idDevolucion, d.estado, d.tipo, d.idVenta, dd.cantidad FROM devolucion d JOIN detalle_devolucion dd ON dd.idDevolucion = d.idDevolucion WHERE d.idVenta = ? ORDER BY d.idDevolucion', [idVenta]);

async function abrirDevolucion() {
  await page.goto(APP + '/dashboard/ventas');
  await page.getByRole('button', { name: 'Registrar Cambio o Reembolso' }).click();
  await page.waitForSelector('#dev-campo-1');
}
async function buscarComprobante(num) {
  await page.fill('#dev-campo-1', String(num));
  await page.getByRole('button', { name: 'Buscar Comprobante' }).click();
  await page.waitForTimeout(1200);
}
async function devolver(idVenta, cantidad, motivo, paso) {
  await abrirDevolucion();
  await buscarComprobante(idVenta);
  await page.getByRole('button', { name: 'Seleccionar' }).first().click();
  await page.waitForSelector('#dev-campo-3');
  await page.fill('#dev-campo-3', String(cantidad));
  await page.getByLabel('Motivo de la devolución:').fill(motivo);
  capturas.push(await captura(page, 'CP10', paso + '_formulario'));
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await page.waitForTimeout(1500);
  capturas.push(await captura(page, 'CP10', paso + '_resultado'));
  return page.__dialogos.splice(0);
}

try {
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');

  // Precondición: venta registrada de 2 unidades de Taladro Bosch
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  await agregarProducto(page, 'Taladro', 2);
  await confirmarVenta(page);
  await page.waitForURL('**/dashboard/ventas');
  const venta = (await consulta('SELECT v.idVenta, d.cantidad FROM venta v JOIN detalle_venta d ON d.idVenta = v.idVenta JOIN producto p ON p.idProducto = d.idProducto WHERE p.codigo = ? ORDER BY v.idVenta DESC LIMIT 1', ['PRD-0001']))[0];
  capturas.push(await captura(page, 'CP10', '0_precondicion_venta_2_taladros'));
  page.__dialogos.splice(0);
  const stockAntes = await stock();
  obs.push(`Precondición: venta N° ${venta.idVenta} con ${venta.cantidad} Taladro Bosch; stock antes de la devolución: ${stockAntes}.`);

  // 1-2. Buscar la venta y devolver 1 unidad (motivo Producto defectuoso)
  const m1 = await devolver(venta.idVenta, 1, 'Producto defectuoso', '2_devolucion_1');
  const s1 = await stock();

  // 3. Devolver la unidad restante
  const m2 = await devolver(venta.idVenta, 1, 'Producto defectuoso', '3_devolucion_restante');
  const s2 = await stock();

  // 4. Intentar devolver 3 unidades de una venta de 2
  const devAntes = (await devolucionesDe(venta.idVenta)).length;
  const m3 = await devolver(venta.idVenta, 3, 'Producto defectuoso', '4_exceso_3');
  const s3 = await stock();
  const devDespues = (await devolucionesDe(venta.idVenta)).length;

  // 5. Intentar una devolución para la venta 9999
  await abrirDevolucion();
  await buscarComprobante(9999);
  const msg9999 = await page.evaluate(() => [...document.querySelectorAll('.text-danger')].map(e => e.innerText.trim()).filter(Boolean).join(' | '));
  capturas.push(await captura(page, 'CP10', '5_venta_9999'));
  const s4 = await stock();

  // 6. Consultar el stock del producto
  await page.goto(APP + '/dashboard/productos');
  await page.getByPlaceholder('Buscar por código o nombre').fill('Taladro');
  await page.waitForTimeout(400);
  const stockPantalla = await page.$$eval('table tbody tr', trs => trs.map(tr => tr.cells[2].innerText.trim()));
  capturas.push(await captura(page, 'CP10', '6_stock_final'));

  const devs = await devolucionesDe(venta.idVenta);
  obs.push(`Devolución 1: mensaje "${m1.join(' | ')}"; stock ${stockAntes} → ${s1}.`);
  obs.push(`Devolución restante: mensaje "${m2.join(' | ')}"; stock ${s1} → ${s2}.`);
  obs.push(`Exceso (3 de 2): mensaje "${m3.join(' | ')}"; devoluciones de la venta ${devAntes} → ${devDespues}; stock ${s2} → ${s3}.`);
  obs.push(`Venta 9999: mensaje "${msg9999}"; stock ${s3} → ${s4}.`);
  obs.push(`BD: devoluciones ligadas a la venta N° ${venta.idVenta}: ${devs.map(d => `N° ${d.idDevolucion} (${d.estado}, ${d.tipo}, ${d.cantidad} u.)`).join('; ')}. Stock en pantalla: ${stockPantalla.join(', ')}.`);

  const aprobado = s1 === stockAntes + 1 && s2 === stockAntes + 2 && devs.length === 2 && devs.every(d => d.idVenta === venta.idVenta)
    && devDespues === devAntes && s3 === s2 && m3.length > 0 && msg9999.includes('no encontrado') && s4 === s3;
  guardarResultado('CP10', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Dos devoluciones de 1 unidad quedaron ligadas a la venta N° ${venta.idVenta} (APROBADA, REEMBOLSO) y repusieron el stock ${stockAntes} → ${s1} → ${s2}. El exceso de 3 unidades se rechazó ("${m3.join(' / ')}") y la venta 9999 se informó como "${msg9999}", sin cambios de stock.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP10', 'error'));
  guardarResultado('CP10', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
