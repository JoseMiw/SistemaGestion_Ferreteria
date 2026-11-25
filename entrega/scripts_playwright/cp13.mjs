// CP13 – RF06 / DEF-09 (regresión): un producto INACTIVO no se vende ni se entrega en un cambio
import { abrirNavegador, captura, login, cerrarSesion, consulta, ahora, guardarResultado, APP } from './comun.mjs';
import { abrirNuevaVenta, seleccionarCliente, agregarProducto, confirmarVenta } from './venta_ui.mjs';

const API = 'http://localhost:8080/api';
const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const producto = async (codigo) => (await consulta('SELECT idProducto, nombre, stock, estado, precioVenta FROM producto WHERE codigo = ?', [codigo]))[0];
const hoy = () => new Date().toLocaleDateString('en-CA');

// Petición directa a la API con el token de la sesión actual
async function post(ruta, cuerpo) {
  const token = await page.evaluate(() => sessionStorage.getItem('token'));
  const r = await page.request.post(API + ruta, { headers: { Authorization: `Bearer ${token}` }, data: cuerpo });
  let mensaje = await r.text();
  try { mensaje = JSON.parse(mensaje).message ?? mensaje; } catch { }
  return { status: r.status(), mensaje };
}

// El gerente cambia el estado del producto desde Productos > Editar
async function cambiarEstado(id, estado, paso) {
  await page.goto(APP + `/dashboard/productos/editar/${id}`);
  await page.waitForFunction(() => document.querySelector('#prod-nombre')?.value.length > 0);
  await page.selectOption('#prod-estado', estado);
  capturas.push(await captura(page, 'CP13', paso));
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.waitForURL('**/dashboard/productos');
}

try {
  const ini = await producto('PRD-0001'); // Taladro Bosch
  const idCliente = (await consulta("SELECT idCliente FROM cliente WHERE DNI = '12345678'"))[0].idCliente;
  if (ini.stock < 1) throw new Error(`Taladro Bosch necesita stock >= 1 (tiene ${ini.stock})`);

  // Precondición: marcar Taladro Bosch como INACTIVO (Gerente)
  await login(page, 'Gerente', '123');
  await page.waitForURL('**/dashboard');
  await cambiarEstado(ini.idProducto, 'INACTIVO', '0_producto_inactivo');
  const inactivo = await producto('PRD-0001');
  await cerrarSesion(page);

  // 1. Iniciar sesión como vendedor
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');

  // 2. Ventas > Nueva venta; buscar el producto INACTIVO
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  await page.fill('#venta-producto', 'Taladro');
  await page.waitForTimeout(1200);
  const sugerencias = await page.locator('.sugerencia-item').allInnerTexts();
  capturas.push(await captura(page, 'CP13', '2_busqueda_sin_sugerencia'));

  // 3. Intentar venderlo (la pantalla no lo ofrece: se intenta directo contra la API)
  const precio = Number(ini.precioVenta);
  const venta = await post('/ventas', {
    fechaVenta: hoy(), tipoComprobante: 'FACTURA', cliente: { idCliente }, tipoPago: { idTipoPago: 1 },
    detalleVenta: [{ producto: { idProducto: ini.idProducto }, cantidad: 1, precioUnitario: precio, subtotal: precio }]
  });
  const s3 = (await producto('PRD-0001')).stock;

  // 4. Repetir el intento desde un cambio: venta de 1 Martillo y cambio por el Taladro inactivo
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  await agregarProducto(page, 'Martillo', 1);
  await confirmarVenta(page);
  await page.waitForURL('**/dashboard/ventas');
  page.__dialogos.splice(0);
  const idVentaM = (await consulta("SELECT MAX(v.idVenta) id FROM venta v JOIN detalle_venta d ON d.idVenta = v.idVenta JOIN producto p ON p.idProducto = d.idProducto WHERE p.codigo = 'PRD-0002'"))[0].id;
  const martillo = await producto('PRD-0002');

  await page.goto(APP + '/dashboard/ventas');
  await page.getByRole('button', { name: 'Registrar Cambio o Reembolso' }).click();
  await page.waitForSelector('#dev-campo-1');
  await page.waitForTimeout(500); // esperar a que Angular termine de enlazar el campo
  await page.fill('#dev-campo-1', String(idVentaM));
  await page.getByRole('button', { name: 'Buscar Comprobante' }).click();
  await page.waitForSelector('text=Comprobante encontrado');
  await page.getByRole('button', { name: 'Seleccionar' }).first().click();
  await page.selectOption('#dev-campo-8', 'CAMBIO');
  await page.waitForSelector('thead.table-success');
  await page.waitForTimeout(1000);
  const opcionesCambio = await page.$$eval('table:has(thead.table-success) tbody tr', trs => trs.map(tr => tr.cells[0].innerText.trim()));
  capturas.push(await captura(page, 'CP13', '4_cambio_sin_producto_inactivo'));

  const motivo = 'CP13: cambio por producto inactivo';
  const cambio = await post('/devoluciones', {
    fechaDevolucion: hoy(), motivo, idVenta: idVentaM,
    detalleDevolucion: [{ producto: { idProducto: martillo.idProducto }, cantidad: 1, motivo }],
    nuevoProducto: { idProducto: ini.idProducto, cantidad: 1 }
  });
  const s4 = (await producto('PRD-0001')).stock;
  const m4 = (await producto('PRD-0002')).stock;
  const devs = (await consulta('SELECT COUNT(*) n FROM devolucion WHERE idVenta = ?', [idVentaM]))[0].n;

  // 5. Reactivar el producto (Gerente) y repetir la venta (Vendedor)
  await cerrarSesion(page);
  await login(page, 'Gerente', '123');
  await page.waitForURL('**/dashboard');
  await cambiarEstado(ini.idProducto, 'ACTIVO', '5a_producto_reactivado');
  const reactivado = await producto('PRD-0001');
  await cerrarSesion(page);
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');
  await abrirNuevaVenta(page);
  await seleccionarCliente(page, '12345678');
  await agregarProducto(page, 'Taladro', 1);
  capturas.push(await captura(page, 'CP13', '5b_taladro_agregado'));
  await confirmarVenta(page);
  await page.waitForURL('**/dashboard/ventas', { timeout: 8000 }).catch(() => { });
  capturas.push(await captura(page, 'CP13', '5c_venta_registrada'));
  const s5 = (await producto('PRD-0001')).stock;
  const dialogos = page.__dialogos.splice(0);

  obs.push(`Precondición: estado de Taladro Bosch ${ini.estado} → ${inactivo.estado} (desde Productos > Editar, rol Gerente); stock ${ini.stock}.`);
  obs.push(`Paso 2: sugerencias al buscar "Taladro": ${sugerencias.length ? sugerencias.join(' | ') : 'ninguna'}.`);
  obs.push(`Paso 3: POST /api/ventas con Taladro Bosch → HTTP ${venta.status} "${venta.mensaje}"; stock ${ini.stock} → ${s3}.`);
  obs.push(`Paso 4: venta N° ${idVentaM} de 1 Martillo Stanley; productos ofrecidos para el cambio: ${opcionesCambio.join(', ') || 'ninguno'}. POST /api/devoluciones con cambio por Taladro Bosch → HTTP ${cambio.status} "${cambio.mensaje}"; stock Taladro ${s3} → ${s4}, stock Martillo ${martillo.stock} → ${m4}; devoluciones de la venta: ${devs}.`);
  obs.push(`Paso 5: estado ${reactivado.estado}; venta de 1 Taladro Bosch ${dialogos.length ? 'con mensaje "' + dialogos.join(' | ') + '"' : 'sin mensajes de error'}; stock ${s4} → ${s5}.`);

  const aprobado = inactivo.estado === 'INACTIVO' && !sugerencias.some(s => s.includes('Taladro'))
    && venta.status === 400 && venta.mensaje.includes('inactivo') && s3 === ini.stock
    && !opcionesCambio.includes('Taladro Bosch') && cambio.status === 400 && cambio.mensaje.includes('inactivo')
    && s4 === ini.stock && m4 === martillo.stock && devs === 0
    && reactivado.estado === 'ACTIVO' && s5 === s4 - 1;
  guardarResultado('CP13', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Con Taladro Bosch INACTIVO: no se ofreció en la venta ni en el cambio; la API rechazó la venta (HTTP ${venta.status}: "${venta.mensaje}") y el cambio (HTTP ${cambio.status}: "${cambio.mensaje}") sin modificar el stock (${ini.stock}). Reactivado (ACTIVO), la venta se registró y el stock pasó de ${s4} a ${s5}.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  console.log('REVISAR: si el error ocurrió entre el paso 0 y el 5, Taladro Bosch puede haber quedado INACTIVO.');
  capturas.push(await captura(page, 'CP13', 'error'));
  guardarResultado('CP13', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
