// CP06 – RF06: venta con stock suficiente
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';
import { abrirNuevaVenta, seleccionarCliente, agregarProducto, confirmarVenta } from './venta_ui.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const stock = async () => (await consulta("SELECT stock FROM producto WHERE codigo = 'PRD-0002'"))[0].stock;

try {
  const stockInicial = await stock();
  const ultimaAntes = (await consulta('SELECT COALESCE(MAX(idVenta),0) m FROM venta'))[0].m;

  // 1. Iniciar sesión como vendedor
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');
  capturas.push(await captura(page, 'CP06', '1_login_vendedor'));

  // 2. Ventas > Registrar Venta y seleccionar el cliente (DNI 12345678)
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  capturas.push(await captura(page, 'CP06', '2_cliente_seleccionado'));

  // 3. Agregar Martillo Stanley con cantidad 2
  await agregarProducto(page, 'Martillo', 2);
  const resumen = await page.evaluate(() => document.querySelector('.card .card-body .card-body')?.innerText || '');
  capturas.push(await captura(page, 'CP06', '3_producto_agregado'));

  // 4. Confirmar la venta
  await confirmarVenta(page);
  await page.waitForURL('**/dashboard/ventas');
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP06', '4_venta_confirmada'));
  const dialogos = page.__dialogos.splice(0);

  // 5. Consultar el stock del producto
  await page.goto(APP + '/dashboard/productos');
  await page.getByPlaceholder('Buscar por código o nombre').fill('Martillo');
  await page.waitForTimeout(400);
  const filaUi = await page.$$eval('table tbody tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText.trim())));
  capturas.push(await captura(page, 'CP06', '5_stock_despues'));

  const venta = (await consulta('SELECT v.idVenta, v.subtotal, v.igv, v.total, c.DNI, c.nombres, c.apellidos FROM venta v JOIN cliente c ON c.idCliente = v.idCliente WHERE v.idVenta > ? ORDER BY v.idVenta DESC LIMIT 1', [ultimaAntes]))[0];
  const det = venta ? await consulta('SELECT d.cantidad, d.precioUnitario, d.subtotal FROM detalle_venta d WHERE d.idVenta = ?', [venta.idVenta]) : [];
  const stockFinal = await stock();

  obs.push(`Resumen en pantalla antes de confirmar: ${resumen.replace(/\s+/g, ' ').trim()}.`);
  if (dialogos.length) obs.push(`Ventanas emergentes: ${dialogos.join(' | ')}.`);
  obs.push(venta ? `BD: venta N° ${venta.idVenta}, cliente ${venta.nombres} ${venta.apellidos} (DNI ${venta.DNI}), detalle ${det.map(d => `${d.cantidad} x ${d.precioUnitario} = ${d.subtotal}`).join(', ')}, subtotal ${venta.subtotal}, IGV ${venta.igv}, total ${venta.total}.` : 'BD: no se registró ninguna venta.');
  obs.push(`Stock de Martillo Stanley: ${stockInicial} → ${stockFinal} (pantalla: ${filaUi.map(f => f[2]).join(', ')}).`);

  const aprobado = !!venta && venta.DNI === '12345678' && Number(venta.total) === 28 && Number(venta.subtotal) === 23.73
    && Number(venta.igv) === 4.27 && det.length === 1 && det[0].cantidad === 2 && stockInicial === 20 && stockFinal === 18;

  guardarResultado('CP06', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: venta
      ? `Venta N° ${venta.idVenta} registrada para Juan Lopez: 2 x S/ 14.00, subtotal ${venta.subtotal}, IGV ${venta.igv}, total ${venta.total} (el precio de venta incluye IGV). Stock de Martillo Stanley ${stockInicial} → ${stockFinal}.`
      : 'La venta no se registró.',
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP06', 'error'));
  guardarResultado('CP06', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
