// CP14 – RF05 / commit f4d2c37: entrega de una orden aprobada, stock y mensaje en la página
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const stockDe = async (id) => (await consulta('SELECT stock FROM producto WHERE idProducto = ?', [id]))[0].stock;

try {
  const orden = (await consulta("SELECT idOrdenCompra, idCotizacion FROM orden_compra WHERE estado = 'APROBADA' ORDER BY idOrdenCompra DESC LIMIT 1"))[0];
  if (!orden) throw new Error('No hay ninguna orden de compra APROBADA (precondición: ejecutar CP04 y CP05 antes)');
  const id = orden.idOrdenCompra;
  const productos = await consulta('SELECT p.idProducto, p.nombre, p.stock, dc.cantidad FROM detalle_cotizacion dc JOIN producto p ON p.idProducto = dc.idProducto WHERE dc.idCotizacion = ?', [orden.idCotizacion]);

  // 1. Iniciar sesión con un rol autorizado (Gerente)
  await login(page, 'Gerente', '123');
  await page.waitForURL('**/dashboard');

  // 2. Ir a la lista de órdenes de compra
  await page.getByRole('link', { name: 'Órdenes de compra' }).click();
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP14', '2_lista_ordenes'));

  // 3. Registrar la entrega de la orden aprobada
  await page.goto(APP + `/dashboard/compras/ordenes/detalle/${id}`);
  await page.getByRole('button', { name: 'Registrar entrega' }).click();
  await page.waitForSelector('#entrega-cant-0');
  capturas.push(await captura(page, 'CP14', '3_formulario_entrega'));
  await page.getByRole('button', { name: 'Registrar Entrega', exact: true }).click();

  // 4. Observar el mensaje mostrado en la página
  await page.waitForURL('**/dashboard/compras/ordenes');
  await page.waitForSelector('.alert-success');
  await page.waitForTimeout(800);
  const mensaje = (await page.locator('.alert-success').innerText()).trim();
  const dialogos = page.__dialogos.splice(0);
  capturas.push(await captura(page, 'CP14', '4_mensaje_en_pagina'));

  // 5. Consultar el stock del producto
  const estado = (await consulta('SELECT estado FROM orden_compra WHERE idOrdenCompra = ?', [id]))[0].estado;
  const cambios = [];
  for (const p of productos) cambios.push({ ...p, despues: await stockDe(p.idProducto) });
  await page.goto(APP + '/dashboard/productos');
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP14', '5_stock_despues'));

  const esperado = `Entrega de la orden N° ${id} registrada correctamente. El stock fue actualizado.`;
  obs.push(`Orden N° ${id} (cotización N° ${orden.idCotizacion}) en estado APROBADA antes de la entrega; después: ${estado}.`);
  obs.push(`Mensaje en la página: "${mensaje}". Ventanas emergentes (alert): ${dialogos.length ? dialogos.join(' | ') : 'ninguna'}.`);
  obs.push(`Stock: ${cambios.map(c => `${c.nombre} ${c.stock} + ${c.cantidad} → ${c.despues}`).join('; ')}.`);

  const aprobado = mensaje === esperado && dialogos.length === 0 && estado === 'ENTREGADA'
    && cambios.every(c => c.despues === c.stock + c.cantidad);
  guardarResultado('CP14', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `La lista de órdenes mostró "${mensaje}" sin ventana emergente; la orden N° ${id} quedó ${estado} y el stock aumentó en la cantidad entregada (${cambios.map(c => `${c.nombre} ${c.stock} → ${c.despues}`).join('; ')}).`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP14', 'error'));
  guardarResultado('CP14', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
