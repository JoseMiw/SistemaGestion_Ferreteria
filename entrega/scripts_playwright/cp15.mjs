// CP15 – RF10 (extensión): cambio de producto en una devolución
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';
import { abrirNuevaVenta, seleccionarCliente, agregarProducto, confirmarVenta } from './venta_ui.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const producto = async (codigo) => (await consulta('SELECT idProducto, nombre, stock FROM producto WHERE codigo = ?', [codigo]))[0];

try {
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');

  // Precondición: venta de 1 Martillo Stanley (producto A)
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  await agregarProducto(page, 'Martillo', 1);
  await confirmarVenta(page);
  await page.waitForURL('**/dashboard/ventas');
  page.__dialogos.splice(0);
  const idVenta = (await consulta("SELECT MAX(v.idVenta) id FROM venta v JOIN detalle_venta d ON d.idVenta = v.idVenta JOIN producto p ON p.idProducto = d.idProducto WHERE p.codigo = 'PRD-0002'"))[0].id;
  const a0 = await producto('PRD-0002'); // A: Martillo Stanley
  const b0 = await producto('PRD-0001'); // B: Taladro Bosch
  if (b0.stock < 1) throw new Error(`Taladro Bosch necesita stock >= 1 (tiene ${b0.stock})`);
  capturas.push(await captura(page, 'CP15', '0_precondicion_venta'));

  // 1. Cambio o Reembolso > seleccionar la venta
  await page.goto(APP + '/dashboard/ventas');
  await page.getByRole('button', { name: 'Registrar Cambio o Reembolso' }).click();
  await page.waitForSelector('#dev-campo-1');
  await page.waitForTimeout(500); // esperar a que Angular termine de enlazar el campo
  await page.fill('#dev-campo-1', String(idVenta));
  await page.getByRole('button', { name: 'Buscar Comprobante' }).click();
  await page.waitForSelector('text=Comprobante encontrado');
  await page.getByRole('button', { name: 'Seleccionar' }).first().click();
  capturas.push(await captura(page, 'CP15', '1_venta_y_producto_A'));

  // 2. Elegir cambio de producto en vez de devolución simple
  await page.selectOption('#dev-campo-8', 'CAMBIO');
  await page.waitForSelector('thead.table-success');
  await page.waitForTimeout(1000);
  capturas.push(await captura(page, 'CP15', '2_tipo_cambio'));

  // 3. Seleccionar el producto B como reemplazo
  await page.locator('table:has(thead.table-success) tbody tr', { hasText: 'Taladro Bosch' }).getByRole('button', { name: 'Seleccionar' }).click();
  await page.fill('#dev-campo-7', 'CP15: cambio de Martillo Stanley por Taladro Bosch');
  await page.waitForTimeout(300);
  const diferencia = (await page.locator('.card-body', { hasText: 'Diferencia:' }).last().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  capturas.push(await captura(page, 'CP15', '3_producto_B_y_diferencia'));

  // 4. Confirmar el cambio
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await page.waitForURL('**/dashboard/ventas', { timeout: 8000 }).catch(() => { });
  const dialogos = page.__dialogos.splice(0);
  capturas.push(await captura(page, 'CP15', '4_cambio_registrado'));

  // 5. Consultar el stock de A y de B
  const a1 = await producto('PRD-0002');
  const b1 = await producto('PRD-0001');
  const dev = (await consulta('SELECT d.idDevolucion, d.tipo, d.estado, d.idVenta, d.idProductoCambio, d.cantidadCambio, dd.cantidad FROM devolucion d JOIN detalle_devolucion dd ON dd.idDevolucion = d.idDevolucion WHERE d.idVenta = ? ORDER BY d.idDevolucion DESC LIMIT 1', [idVenta]))[0];
  await page.goto(APP + '/dashboard/productos');
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP15', '5_stock_A_y_B'));

  obs.push(`Precondición: venta N° ${idVenta} con 1 Martillo Stanley; stock A (Martillo) ${a0.stock}, B (Taladro) ${b0.stock}.`);
  obs.push(`Resumen en pantalla: ${diferencia || '—'}.`);
  obs.push(`Mensaje: "${dialogos.join(' | ')}".`);
  obs.push(dev ? `BD: devolución N° ${dev.idDevolucion} ligada a la venta N° ${dev.idVenta}, tipo ${dev.tipo}, estado ${dev.estado}, devuelto ${dev.cantidad} u., producto de cambio id ${dev.idProductoCambio} x ${dev.cantidadCambio}.` : 'BD: no se registró la devolución.');
  obs.push(`Stock A ${a0.stock} → ${a1.stock}; stock B ${b0.stock} → ${b1.stock}.`);

  const aprobado = !!dev && dev.tipo === 'CAMBIO' && dev.idVenta === idVenta && dev.idProductoCambio === b0.idProducto
    && dev.cantidadCambio === 1 && dev.cantidad === 1 && a1.stock === a0.stock + 1 && b1.stock === b0.stock - 1
    && dialogos.some(m => m.includes('correctamente'));
  guardarResultado('CP15', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: dev
      ? `Cambio N° ${dev.idDevolucion} (tipo ${dev.tipo}) ligado a la venta N° ${idVenta}: Martillo Stanley ${a0.stock} → ${a1.stock} (+1) y Taladro Bosch ${b0.stock} → ${b1.stock} (-1). Mensaje: "${dialogos.join(' / ')}".`
      : 'El cambio no se registró.',
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP15', 'error'));
  guardarResultado('CP15', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
