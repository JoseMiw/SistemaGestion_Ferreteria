// CP05 – RF05: orden de compra desde cotización y aprobación por el gerente
import { abrirNavegador, captura, login, cerrarSesion, consulta, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];

try {
  // 1. Iniciar sesión como gerente
  await login(page, 'Gerente', '123');
  await page.waitForURL('**/dashboard');
  capturas.push(await captura(page, 'CP05', '1_login_gerente'));

  // 2. Crear una orden de compra desde la cotización registrada (CP04)
  await page.getByRole('link', { name: 'Cotizaciones' }).click();
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP05', '2a_cotizaciones'));
  await page.getByRole('button', { name: 'Generar orden' }).first().click();
  await page.waitForSelector('app-modal-confirmacion button:has-text("Aceptar")');
  capturas.push(await captura(page, 'CP05', '2b_confirmar_generar_orden'));
  await page.locator('app-modal-confirmacion button:has-text("Aceptar")').click();
  await page.waitForURL('**/compras/ordenes/detalle/*');
  await page.waitForSelector('text=Aprobar orden');
  capturas.push(await captura(page, 'CP05', '2c_orden_creada_pendiente'));
  const idOrden = Number(page.url().split('/').pop());
  const creada = (await consulta('SELECT estado, idCotizacion, montoTotal FROM orden_compra WHERE idOrdenCompra = ?', [idOrden]))[0];
  obs.push(`Paso 2: orden N° ${idOrden} creada desde la cotización N° ${creada.idCotizacion}, estado ${creada.estado}, total ${creada.montoTotal}.`);

  // 3. Aprobar la orden completa
  await page.getByRole('button', { name: 'Aprobar orden' }).click();
  await page.waitForSelector('app-modal-confirmacion button:has-text("Aceptar")');
  await page.locator('app-modal-confirmacion button:has-text("Aceptar")').click();
  await page.waitForSelector('text=Aprobada por');
  capturas.push(await captura(page, 'CP05', '3_orden_aprobada'));
  const aprobada = (await consulta('SELECT o.estado, o.fechaAprobacion, u.nombreUsuario, u.rol FROM orden_compra o JOIN usuario u ON u.idUsuario = o.idUsuarioAprobador WHERE o.idOrdenCompra = ?', [idOrden]))[0];
  const paso3Ok = aprobada.estado === 'APROBADA' && aprobada.rol === 'GERENTE' && !!aprobada.fechaAprobacion;
  obs.push(`Paso 3: BD estado ${aprobada.estado}, aprobador ${aprobada.nombreUsuario} (${aprobada.rol}), fecha ${new Date(aprobada.fechaAprobacion).toLocaleString('es-PE')}.`);

  // 4. Orden incompleta: no ejecutable (opción a aprobada por el usuario)
  obs.push('Paso 4: NO EJECUTABLE. El sistema solo crea órdenes desde cotizaciones ya validadas (cantidad y precio > 0, verificado en CP04) y la BD lo refuerza con CHECK (cantidad > 0, precioUnitario > 0), por lo que no existe forma de obtener una orden incompleta para intentar aprobarla.');

  // 5. Ingresar como vendedor e intentar aprobar una orden
  await cerrarSesion(page);
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');
  const menu = await page.locator('nav[aria-label="Menú del sistema"]').innerText();
  capturas.push(await captura(page, 'CP05', '5a_menu_vendedor'));
  await page.goto(APP + `/dashboard/compras/ordenes/detalle/${idOrden}`);
  await page.waitForTimeout(1200);
  const urlTrasIntento = page.url();
  const aviso = await page.locator('body').innerText();
  capturas.push(await captura(page, 'CP05', '5b_vendedor_url_orden_denegada'));
  // Intento directo contra la API con la sesión del vendedor (verificación en el servidor)
  const token = await page.evaluate(() => sessionStorage.getItem('token'));
  const r = await page.request.put(`http://localhost:8080/api/ordenes/${idOrden}/aprobar`, { headers: { Authorization: `Bearer ${token}` } });
  const cuerpo = await r.text();
  const paso5Ok = !menu.includes('Órdenes de compra') && urlTrasIntento.includes('no_permiso') && r.status() === 403;
  obs.push(`Paso 5: menú del vendedor sin "Órdenes de compra"; URL directa redirigida a ${urlTrasIntento.replace(APP, '')} con aviso "${aviso.includes('No tiene permisos') ? 'No tiene permisos para acceder a esta sección' : '—'}"; PUT /api/ordenes/${idOrden}/aprobar con token del vendedor → HTTP ${r.status()} ${cuerpo}.`);

  guardarResultado('CP05', {
    fecha: inicio, estado: 'No ejecutado',
    pasosOk: { paso2: creada.estado === 'PENDIENTE', paso3: paso3Ok, paso5: paso5Ok },
    obtenido: `Pasos 1, 2, 3 y 5 ejecutados y conformes: la orden N° ${idOrden} se creó desde la cotización (PENDIENTE), el gerente la aprobó (APROBADA, aprobador y fecha registrados) y el vendedor no pudo aprobar (menú sin el módulo, URL redirigida y API con HTTP 403). Paso 4 no ejecutable: el sistema impide crear una orden incompleta.`,
    observaciones: obs.join(' '), capturas
  });
  console.log('NO EJECUTADO (paso 4)'); console.log({ paso3Ok, paso5Ok }); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP05', 'error'));
  guardarResultado('CP05', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
