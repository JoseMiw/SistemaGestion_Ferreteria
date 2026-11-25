// CP01 – RF01: alertas de stock bajo
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
try {
  // 1. Iniciar sesión como almacenero
  await login(page, 'Almacenero', '123');
  await page.waitForURL('**/dashboard');
  capturas.push(await captura(page, 'CP01', '1_login_almacenero'));

  // 2. Ingresar al módulo Alertas de stock
  await page.getByRole('link', { name: 'Alertas de stock' }).click();
  await page.waitForURL('**/inventario/alertas');
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP01', '2_modulo_alertas'));

  // 3. Ejecutar la consulta (botón Actualizar)
  await page.getByRole('button', { name: 'Actualizar' }).click();
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP01', '3_consulta_ejecutada'));

  // 4. Revisar productos listados y columnas
  const columnas = await page.$$eval('table thead th', ths => ths.map(t => t.innerText.trim()));
  const filas = await page.$$eval('table tbody tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText.trim())));
  capturas.push(await captura(page, 'CP01', '4_revision_resultado'));

  const nombres = filas.map(f => f[1]);
  const bd = await consulta('SELECT codigo, nombre, stock, stockMinimo FROM producto WHERE stock <= stockMinimo ORDER BY stock');

  const columnasOk = ['Código', 'Nombre', 'Stock actual', 'Stock mínimo'].every(c => columnas.includes(c));
  const taladro = filas.find(f => f[1] === 'Taladro Bosch');
  const martillo = filas.find(f => f[1] === 'Martillo Stanley');
  const pinturaAusente = !nombres.includes('Pintura Latex');

  obs.push(`Columnas mostradas: ${columnas.join(', ')}.`);
  obs.push(`Filas: ${filas.map(f => `${f[0]} ${f[1]} (stock ${f[2]}, mínimo ${f[3]}, ${f[4]})`).join('; ')}.`);
  obs.push(`BD (SELECT stock <= stockMinimo): ${bd.map(p => `${p.codigo} ${p.nombre} ${p.stock}/${p.stockMinimo}`).join('; ')}.`);

  const aprobado = columnasOk && taladro && taladro[2] === '3' && taladro[3] === '5'
    && martillo && martillo[2] === '5' && martillo[3] === '5' && pinturaAusente && filas.length === bd.length;

  guardarResultado('CP01', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: aprobado
      ? 'Se listaron Taladro Bosch (PRD-0001, stock 3, mínimo 5) y Martillo Stanley (PRD-0002, stock 5, mínimo 5) con código, nombre, stock actual y stock mínimo. Pintura Latex (stock 12) no aparece.'
      : 'El listado no coincide con lo esperado (ver observaciones).',
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP01', 'error'));
  guardarResultado('CP01', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
