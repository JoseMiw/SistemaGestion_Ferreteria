// CP04 – RF04: cotización válida e inválidas
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy = new Date();
const vigencia15 = iso(new Date(hoy.getTime() + 15 * 86400000));
const contar = async () => (await consulta('SELECT COUNT(*) n FROM cotizacion'))[0].n;

async function llenar({ cantidad, precio, vigencia }) {
  await page.goto(APP + '/dashboard/compras/cotizaciones');
  await page.getByRole('button', { name: 'Nueva Cotización' }).click();
  await page.waitForSelector('#cot-ruc');
  await page.fill('#cot-ruc', '12345678901');
  await page.locator('button:has-text("Buscar")').click();
  await page.waitForSelector('text=Ferretería Central SAC');
  await page.fill('#cot-vigencia', vigencia);
  await page.fill('#cot-producto', 'Cemento');
  await page.waitForSelector('ul.list-group button');
  await page.locator('ul.list-group button').first().click();
  await page.waitForSelector('#cot-cant-0');
  await page.fill('#cot-cant-0', String(cantidad));
  await page.fill('#cot-precio-0', String(precio));
}
const registrar = async () => { await page.getByRole('button', { name: 'Registrar Cotización' }).click(); await page.waitForTimeout(1200); };
const erroresVisibles = () => page.evaluate(() => ({
  mensajes: [...document.querySelectorAll('[role=alert]')].map(e => e.innerText.trim()).filter(Boolean),
  marcados: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.id)
}));

try {
  await login(page, 'AsistenteCompra', '123');
  await page.waitForURL('**/dashboard');

  // 1-2. Nueva cotización válida
  const n0 = await contar();
  await llenar({ cantidad: 100, precio: '25.00', vigencia: vigencia15 });
  capturas.push(await captura(page, 'CP04', '1_cotizacion_valida_llena'));
  await registrar();
  await page.waitForURL('**/dashboard/compras/cotizaciones');
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP04', '2_cotizacion_valida_guardada'));
  const cot = (await consulta('SELECT c.idCotizacion, c.fechaCotizacion, c.fechaVigencia, c.montoTotal, c.estado, p.nombreProveedor FROM cotizacion c JOIN proveedor p ON p.idProveedor = c.idProveedor ORDER BY c.idCotizacion DESC LIMIT 1'))[0];
  const det = await consulta('SELECT d.cantidad, d.precioUnitario, d.subtotal, pr.nombre FROM detalle_cotizacion d JOIN producto pr ON pr.idProducto = d.idProducto WHERE d.idCotizacion = ?', [cot.idCotizacion]);
  const vigBd = iso(new Date(cot.fechaVigencia));
  const validaOk = (await contar()) === n0 + 1 && cot.nombreProveedor === 'Ferretería Central SAC' && vigBd === vigencia15
    && det.length === 1 && det[0].cantidad === 100 && Number(det[0].precioUnitario) === 25 && det[0].nombre === 'Cemento Sol Tipo I';
  obs.push(`Válida: BD cotización N° ${cot.idCotizacion}, proveedor ${cot.nombreProveedor}, vigencia ${vigBd} (esperada ${vigencia15}), estado ${cot.estado}, detalle ${det.map(d => `${d.cantidad} x ${d.precioUnitario} = ${d.subtotal} ${d.nombre}`).join(', ')}, total ${cot.montoTotal}.`);

  // 3-5. Variantes inválidas
  const variantes = [
    { nombre: 'Precio 0', paso: '3_precio_0', datos: { cantidad: 100, precio: 0, vigencia: vigencia15 } },
    { nombre: 'Cantidad -5', paso: '4_cantidad_menos5', datos: { cantidad: -5, precio: '25.00', vigencia: vigencia15 } },
    { nombre: 'Sin vigencia', paso: '5_sin_vigencia', datos: { cantidad: 100, precio: '25.00', vigencia: '' } },
  ];
  const res = [];
  for (const v of variantes) {
    const antes = await contar();
    await llenar(v.datos);
    await registrar();
    const e = await erroresVisibles();
    capturas.push(await captura(page, 'CP04', v.paso));
    const noGuardada = (await contar()) === antes;
    res.push({ ...v, noGuardada, ...e, dialogos: page.__dialogos.splice(0) });
  }
  for (const r of res) {
    obs.push(`${r.nombre}: ${r.noGuardada ? 'no se guardó' : 'SE GUARDÓ'}; mensajes: "${r.mensajes.join(' | ')}"; campos marcados: ${r.marcados.join(', ') || 'ninguno'}${r.dialogos.length ? '; ventana emergente: ' + r.dialogos.join(' | ') : ''}.`);
  }
  const identificaCampo = (r) => r.marcados.length > 0 && r.mensajes.length > 0;
  const aprobado = validaOk && res.every(r => r.noGuardada && identificaCampo(r));

  guardarResultado('CP04', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Cotización válida ${validaOk ? `N° ${cot.idCotizacion} guardada, asociada a Ferretería Central SAC con 100 x S/ 25.00 y vigencia ${vigBd}` : 'NO coincide'}. ` +
      res.map(r => `${r.nombre}: ${r.noGuardada ? 'no guardada' : 'guardada'}, ${identificaCampo(r) ? 'campo marcado y mensaje "' + r.mensajes.join(' / ') + '"' : 'sin señalar el campo'}`).join('; ') + '.',
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP04', 'error'));
  guardarResultado('CP04', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
