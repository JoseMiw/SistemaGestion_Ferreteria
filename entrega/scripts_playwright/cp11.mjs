// CP11 – RF06: venta con cantidad mayor e igual al stock
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';
import { abrirNuevaVenta, seleccionarCliente, agregarProducto, confirmarVenta } from './venta_ui.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const stock = async () => (await consulta("SELECT stock FROM producto WHERE codigo = 'PRD-0003'"))[0].stock;
const ventas = async () => (await consulta('SELECT COUNT(*) n FROM venta'))[0].n;

try {
  const stockInicial = await stock();
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');

  // 1. Ventas > Registrar Venta (cliente Juan Lopez, DNI 12345678)
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  capturas.push(await captura(page, 'CP11', '1_nueva_venta'));

  // 2. Agregar el producto con cantidad 6 e intentar confirmar
  const v0 = await ventas();
  await agregarProducto(page, 'Pintura', 6);
  capturas.push(await captura(page, 'CP11', '2a_cantidad_6'));
  await confirmarVenta(page);
  const msg6 = page.__dialogos.splice(0);
  capturas.push(await captura(page, 'CP11', '2b_intento_confirmar_6'));

  // 3. Verificar el stock
  const stockTras6 = await stock();
  const ventaNoGuardada = (await ventas()) === v0;

  // 4. Cambiar la cantidad a 5 y confirmar
  const input = page.getByLabel('Cantidad de Pintura Latex');
  await input.fill('5');
  await input.dispatchEvent('change');
  await page.waitForTimeout(300);
  capturas.push(await captura(page, 'CP11', '4a_cantidad_5'));
  await confirmarVenta(page);
  await page.waitForURL('**/dashboard/ventas', { timeout: 8000 }).catch(() => { });
  const msg5 = page.__dialogos.splice(0);
  capturas.push(await captura(page, 'CP11', '4b_venta_confirmada'));

  // 5. Verificar el stock y el estado del producto
  await page.goto(APP + '/dashboard/productos');
  await page.getByPlaceholder('Buscar por código o nombre').fill('Pintura');
  await page.waitForTimeout(400);
  const fila = (await page.$$eval('table tbody tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText.trim()))))[0];
  capturas.push(await captura(page, 'CP11', '5_stock_y_estado'));
  const stockFinal = await stock();
  const ventaNueva = (await consulta('SELECT v.idVenta, d.cantidad, v.total FROM venta v JOIN detalle_venta d ON d.idVenta = v.idVenta WHERE v.idVenta = (SELECT MAX(idVenta) FROM venta)'))[0];

  obs.push(`Stock inicial: ${stockInicial}.`);
  obs.push(`Cantidad 6: mensaje "${msg6.join(' | ')}"; venta ${ventaNoGuardada ? 'no guardada' : 'GUARDADA'}; stock ${stockTras6}.`);
  obs.push(`Cantidad 5: ${msg5.length ? 'mensaje "' + msg5.join(' | ') + '"; ' : ''}venta N° ${ventaNueva.idVenta} con ${ventaNueva.cantidad} unidades, total ${ventaNueva.total}.`);
  obs.push(`Final: stock en BD ${stockFinal}; en pantalla stock ${fila[2]} y estado "${fila[4]}".`);

  const aprobado = stockInicial === 5 && msg6.some(m => m.includes('No hay suficiente stock')) && ventaNoGuardada && stockTras6 === 5
    && ventaNueva.cantidad === 5 && stockFinal === 0 && fila[4] === 'Agotado';
  guardarResultado('CP11', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Con 6 unidades se mostró "${msg6.join(' / ')}", la venta no se guardó y el stock siguió en ${stockTras6}. Con 5 unidades la venta N° ${ventaNueva.idVenta} se registró; el stock quedó en ${stockFinal} con estado ${fila[4]}.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP11', 'error'));
  guardarResultado('CP11', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
