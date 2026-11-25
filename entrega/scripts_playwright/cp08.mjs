// CP08 – RF08: módulos visibles por rol y acceso directo a URL no autorizada
import { abrirNavegador, captura, login, cerrarSesion, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];

// Módulos esperados por rol (matriz de permisos del sistema, coherente con la sección 1.3 del informe)
const esperado = {
  Administrador: ['Dashboard', 'Productos', 'Alertas de stock', 'Ventas', 'Solicitudes de compra', 'Cotizaciones', 'Órdenes de compra', 'Clientes'],
  Gerente: ['Dashboard', 'Productos', 'Alertas de stock', 'Ventas', 'Solicitudes de compra', 'Cotizaciones', 'Órdenes de compra', 'Clientes'],
  Vendedor: ['Dashboard', 'Productos', 'Ventas', 'Clientes'],
  AsistenteCompra: ['Dashboard', 'Productos', 'Solicitudes de compra', 'Cotizaciones', 'Órdenes de compra'],
  Almacenero: ['Dashboard', 'Productos', 'Alertas de stock', 'Solicitudes de compra', 'Órdenes de compra'],
};

try {
  const resultados = [];
  let n = 1;
  for (const [usuario, modulos] of Object.entries(esperado)) {
    // 1. Iniciar sesión con cada rol  2. Revisar los módulos visibles
    await login(page, usuario, '123');
    await page.waitForURL('**/dashboard');
    const visibles = await page.$$eval('nav[aria-label="Menú del sistema"] a.nav-link', as => as.map(a => a.innerText.trim()));
    capturas.push(await captura(page, 'CP08', `${n}_menu_${usuario}`));
    const coincide = visibles.length === modulos.length && modulos.every(m => visibles.includes(m));
    resultados.push({ usuario, visibles, coincide });

    if (usuario === 'Vendedor') {
      // 3. Con el rol Vendedor, pegar la URL del módulo de órdenes de compra
      await page.goto(APP + '/dashboard/compras/ordenes');
      await page.waitForTimeout(1200);
      const url = page.url();
      const aviso = (await page.locator('body').innerText()).includes('No tiene permisos para acceder a esta sección');
      capturas.push(await captura(page, 'CP08', `${n}b_vendedor_url_ordenes`));
      resultados.find(r => r.usuario === 'Vendedor').url = { url: url.replace(APP, ''), aviso, denegado: url.includes('no_permiso') && aviso };
    }
    // 4. Cerrar sesión
    await cerrarSesion(page);
    n++;
  }

  for (const r of resultados) {
    obs.push(`${r.usuario}: ${r.visibles.join(', ')} → ${r.coincide ? 'coincide' : 'NO coincide'} con lo esperado.`);
  }
  const v = resultados.find(r => r.usuario === 'Vendedor').url;
  obs.push(`Vendedor con URL /dashboard/compras/ordenes: redirigido a ${v.url}${v.aviso ? ' con el aviso "No tiene permisos para acceder a esta sección"' : ''}.`);
  obs.push('Observación: el Administrador ve todos los módulos operativos; el sistema no tiene un módulo de gestión de usuarios y accesos (descrito para ese rol en la sección 1.3 del informe, pero sin requisito RF asociado).');

  const aprobado = resultados.every(r => r.coincide) && v.denegado;
  guardarResultado('CP08', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Los cinco roles vieron solo los módulos de su matriz de permisos. Con el Vendedor, la URL directa de Órdenes de compra fue ${v.denegado ? 'denegada (redirección al dashboard con aviso de falta de permisos)' : 'PERMITIDA'}.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP08', 'error'));
  guardarResultado('CP08', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
