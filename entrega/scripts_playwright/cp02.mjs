// CP02 – RF02: solicitud de compra válida e inválidas
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const espera = (ms) => page.waitForTimeout(ms);

async function abrirFormulario() {
  await page.goto(APP + '/dashboard/compras');
  await page.getByRole('button', { name: 'Nueva Solicitud' }).click();
  await page.waitForSelector('#sol-campo-1');
}
async function buscarProveedor() {
  await page.fill('#sol-campo-1', '12345678901');
  await page.locator('button:has-text("Buscar")').first().click();
  await page.waitForFunction(() => document.querySelector('#sol-campo-2').value.length > 0);
}
async function seleccionarCemento(cantidad) {
  await page.fill('#sol-campo-3', 'Cemento');
  await page.waitForSelector('.sugerencia-item');
  await page.locator('.sugerencia-item').first().dispatchEvent('mousedown');
  await page.waitForSelector('#sol-campo-4');
  await page.fill('#sol-campo-4', String(cantidad));
}
async function agregar() { await page.locator('.alert button:has-text("Agregar producto")').click(); await espera(400); }
async function registrar() { await page.getByRole('button', { name: 'Registrar Solicitud' }).click(); await espera(1200); }
const contarSolicitudes = async () => (await consulta('SELECT COUNT(*) n FROM solicitud_compra'))[0].n;
const dialogos = () => page.__dialogos.splice(0);

try {
  // 1. Iniciar sesión como asistente de compras
  await login(page, 'AsistenteCompra', '123');
  await page.waitForURL('**/dashboard');
  capturas.push(await captura(page, 'CP02', '1_login_asistente'));

  // 2. Ingresar a Solicitudes de compra > Nueva Solicitud
  await abrirFormulario();
  capturas.push(await captura(page, 'CP02', '2_formulario'));

  // 3. Registrar la solicitud válida: Cemento Sol Tipo I, cantidad 50, Ferretería Central SAC
  const antes = await contarSolicitudes();
  await buscarProveedor();
  await seleccionarCemento(50);
  await agregar();
  capturas.push(await captura(page, 'CP02', '3a_solicitud_valida_lista'));
  await registrar();
  const dValida = dialogos();
  const nueva = (await consulta('SELECT idSolicitudCompra, estado, fechaCotizacion, montoTotal FROM solicitud_compra ORDER BY idSolicitudCompra DESC LIMIT 1'))[0];
  const detalle = await consulta('SELECT d.cantidad, p.nombre FROM detalle_solicitud_compra d JOIN producto p ON p.idProducto = d.idProducto WHERE d.idSolicitudCompra = ?', [nueva.idSolicitudCompra]);
  await page.waitForURL('**/dashboard/compras');
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP02', '3b_solicitud_valida_guardada'));
  const validaOk = (await contarSolicitudes()) === antes + 1 && nueva.estado === 'PENDIENTE'
    && detalle.length === 1 && detalle[0].cantidad === 50 && detalle[0].nombre === 'Cemento Sol Tipo I';
  obs.push(`Válida: mensaje "${dValida.join(' | ')}"; BD: solicitud N° ${nueva.idSolicitudCompra}, estado ${nueva.estado}, fecha ${new Date(nueva.fechaCotizacion).toISOString().slice(0, 10)}, total ${nueva.montoTotal}, detalle ${detalle.map(d => d.cantidad + ' ' + d.nombre).join(', ')}.`);

  // 4. Repetir con cada dato inválido, uno por vez
  const resultadosInvalidos = [];
  async function variante(nombre, paso, acciones) {
    const n0 = await contarSolicitudes();
    await abrirFormulario();
    await acciones();
    const msgs = dialogos();
    const pantalla = await page.evaluate(() => [...document.querySelectorAll('.text-danger, .alert-danger')].map(e => e.innerText.trim()).filter(Boolean).join(' | '));
    const camposMarcados = await page.evaluate(() => document.querySelectorAll('[aria-invalid="true"], .is-invalid').length);
    capturas.push(await captura(page, 'CP02', paso));
    const n1 = await contarSolicitudes();
    resultadosInvalidos.push({ nombre, noGuardada: n1 === n0, mensajes: msgs, pantalla, camposMarcados });
  }

  await variante('Sin proveedor', '4a_sin_proveedor', async () => {
    await seleccionarCemento(50); await agregar(); await registrar();
  });
  await variante('Sin producto', '4b_sin_producto', async () => {
    await buscarProveedor(); await registrar();
  });
  await variante('Cantidad 0', '4c_cantidad_0', async () => {
    await buscarProveedor(); await seleccionarCemento(0); await agregar(); await registrar();
  });
  await variante('Cantidad -1', '4d_cantidad_menos1', async () => {
    await buscarProveedor(); await seleccionarCemento(-1); await agregar(); await registrar();
  });

  for (const r of resultadosInvalidos) {
    obs.push(`${r.nombre}: ${r.noGuardada ? 'no se guardó' : 'SE GUARDÓ'}; mensajes en ventana emergente: "${r.mensajes.join(' | ')}"; campos marcados en pantalla: ${r.camposMarcados}${r.pantalla ? '; texto en pantalla: ' + r.pantalla : ''}.`);
  }

  const ningunaGuardada = resultadosInvalidos.every(r => r.noGuardada);
  const camposSenalados = resultadosInvalidos.every(r => r.camposMarcados > 0);
  const aprobado = validaOk && ningunaGuardada && camposSenalados;

  guardarResultado('CP02', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    validaOk, ningunaGuardada, camposSenalados,
    obtenido: `Solicitud válida ${validaOk ? 'guardada con N° ' + nueva.idSolicitudCompra + ' y estado PENDIENTE' : 'NO coincide'}. Variantes inválidas: ${ningunaGuardada ? 'ninguna se guardó' : 'alguna se guardó'}; ${camposSenalados ? 'el campo se señaló en pantalla' : 'el error se informó con una ventana emergente, sin señalar el campo en el formulario'}.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP02', 'error'));
  guardarResultado('CP02', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
