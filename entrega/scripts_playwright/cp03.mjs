// CP03 – RF03: búsqueda de producto por código o nombre
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const instantanea = async () => JSON.stringify(await consulta('SELECT * FROM producto ORDER BY idProducto'));
const filas = () => page.$$eval('table tbody tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText.trim())));

try {
  const antes = await instantanea();
  await login(page, 'Almacenero', '123');
  await page.waitForURL('**/dashboard');

  // 1. Ingresar a Productos (buscador de stock)
  await page.getByRole('link', { name: 'Productos' }).click();
  await page.waitForSelector('table tbody tr');
  capturas.push(await captura(page, 'CP03', '1_lista_productos'));

  const buscador = page.getByPlaceholder('Buscar por código o nombre');
  const bd = (await consulta("SELECT codigo, nombre, stock, stockMinimo FROM producto WHERE nombre = 'Taladro Bosch'"))[0];
  const estadoBd = bd.stock <= 0 ? 'Agotado' : bd.stock <= bd.stockMinimo ? 'Bajo' : 'Normal';

  // 2. Buscar por el código del producto
  await buscador.fill(bd.codigo);
  await page.waitForTimeout(400);
  const porCodigo = await filas();
  capturas.push(await captura(page, 'CP03', '2_busqueda_codigo'));

  // 3. Buscar por nombre parcial "Tala"
  await buscador.fill('Tala');
  await page.waitForTimeout(400);
  const porNombre = await filas();
  capturas.push(await captura(page, 'CP03', '3_busqueda_nombre_parcial'));

  // 4. Buscar el código inexistente XXX999
  await buscador.fill('XXX999');
  await page.waitForTimeout(400);
  const inexistente = await page.evaluate(() => document.querySelector('table tbody').innerText.trim());
  capturas.push(await captura(page, 'CP03', '4_codigo_inexistente'));

  // 5. Comparar con la base de datos
  const despues = await instantanea();
  const sinCambios = antes === despues;
  const fila = (f) => f.length === 1 && f[0][0] === bd.codigo && f[0][1] === 'Taladro Bosch' && f[0][2] === String(bd.stock) && f[0][4] === estadoBd;
  const okCodigo = fila(porCodigo);
  const okNombre = fila(porNombre);
  const okInexistente = inexistente.includes('No existe ningún producto');

  obs.push(`BD: ${bd.codigo} Taladro Bosch, stock ${bd.stock}, mínimo ${bd.stockMinimo} → estado esperado ${estadoBd}.`);
  obs.push(`Por código "${bd.codigo}": ${porCodigo.map(f => f.slice(0, 5).join(' / ')).join('; ')}.`);
  obs.push(`Por nombre "Tala": ${porNombre.map(f => f.slice(0, 5).join(' / ')).join('; ')}.`);
  obs.push(`Código XXX999: "${inexistente}".`);
  obs.push(`Tabla producto antes y después de las búsquedas: ${sinCambios ? 'idéntica (no se modificaron datos)' : 'CAMBIÓ'}.`);

  const aprobado = okCodigo && okNombre && okInexistente && sinCambios;
  guardarResultado('CP03', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: aprobado
      ? `Por código (${bd.codigo}) y por nombre parcial ("Tala") se mostró Taladro Bosch con stock ${bd.stock} y estado ${estadoBd}, igual que en la BD. Con XXX999 se informó "No existe ningún producto…" y la tabla producto no cambió.`
      : 'El resultado no coincide con lo esperado (ver observaciones).',
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP03', 'error'));
  guardarResultado('CP03', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
