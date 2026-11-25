// CP16 – RNF06 / commit f4d2c37: modo oscuro guardado por usuario y contraste
import { abrirNavegador, captura, login, cerrarSesion, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const A = 'Gerente', B = 'AsistenteCompra';

const tema = () => page.evaluate(() => document.querySelector('div.d-flex[data-bs-theme]')?.getAttribute('data-bs-theme'));
const preferencias = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('tema_usuario_')).map(k => [k, localStorage.getItem(k)])));
async function entrar(usuario) {
  await login(page, usuario, '123');
  await page.waitForURL('**/dashboard');
  await page.goto(APP + '/dashboard/productos');
  await page.waitForSelector('table tbody tr');
}
// Ratio de contraste WCAG entre el color del texto y el fondo real del elemento
const contrastes = () => page.evaluate(() => {
  const rgb = (c) => c.match(/[\d.]+/g).map(Number);
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const fondo = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const v = rgb(getComputedStyle(e).backgroundColor);
      if (v.length === 3 || v[3] > 0) return v;
    }
    return [255, 255, 255];
  };
  const medir = (nombre, selector) => {
    const el = document.querySelector(selector);
    if (!el) return { nombre, ratio: null };
    const t = lum(rgb(getComputedStyle(el).color)), f = lum(fondo(el));
    return { nombre, ratio: Math.round(((Math.max(t, f) + 0.05) / (Math.min(t, f) + 0.05)) * 100) / 100 };
  };
  return [
    medir('Título de la página', 'main h1'),
    medir('Encabezado de la tabla', 'main table thead th'),
    medir('Celda de la tabla', 'main table tbody td')
  ];
});

try {
  // 1. Iniciar sesión con el usuario A
  await entrar(A);
  const t1 = await tema();
  capturas.push(await captura(page, 'CP16', '1_usuarioA_inicial'));

  // 2. Activar el modo oscuro
  await page.getByRole('button', { name: 'Modo oscuro' }).click();
  await page.waitForTimeout(300);
  const t2 = await tema();
  const boton2 = await page.getByRole('button', { name: 'Modo claro' }).count();
  const pref2 = await preferencias();
  // 6. Contraste de los textos principales en modo oscuro
  const ratios = await contrastes();
  capturas.push(await captura(page, 'CP16', '2_usuarioA_modo_oscuro'));

  // 3-4. Cerrar sesión, volver a entrar con A y verificar que se mantiene
  await cerrarSesion(page);
  await entrar(A);
  const t4 = await tema();
  capturas.push(await captura(page, 'CP16', '4_usuarioA_vuelve_a_entrar'));

  // 5. Cerrar sesión y entrar con el usuario B en el mismo navegador
  await cerrarSesion(page);
  await entrar(B);
  const t5 = await tema();
  const pref5 = await preferencias();
  capturas.push(await captura(page, 'CP16', '5_usuarioB_mismo_navegador'));

  obs.push(`Usuario A (${A}): tema inicial ${t1}; tras pulsar "Modo oscuro" ${t2} (botón cambia a "Modo claro": ${boton2 ? 'sí' : 'no'}); preferencias guardadas: ${JSON.stringify(pref2)}.`);
  obs.push(`Usuario A tras cerrar sesión y volver a entrar: ${t4}.`);
  obs.push(`Usuario B (${B}) en el mismo navegador: ${t5}; preferencias guardadas: ${JSON.stringify(pref5)}.`);
  obs.push(`Contraste en modo oscuro (mínimo WCAG AA 4.5:1): ${ratios.map(r => `${r.nombre} ${r.ratio ?? 'no encontrado'}:1`).join('; ')}.`);

  const contrasteOk = ratios.every(r => r.ratio !== null && r.ratio >= 4.5);
  const aprobado = t1 === 'light' && t2 === 'dark' && boton2 > 0 && t4 === 'dark' && t5 === 'light' && contrasteOk;
  guardarResultado('CP16', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `El usuario ${A} activó el modo oscuro y lo conservó al volver a iniciar sesión (${t4}); el usuario ${B}, en el mismo navegador, siguió con su propio modo (${t5}). Contraste medido en modo oscuro: ${ratios.map(r => `${r.nombre} ${r.ratio}:1`).join(', ')}.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP16', 'error'));
  guardarResultado('CP16', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
