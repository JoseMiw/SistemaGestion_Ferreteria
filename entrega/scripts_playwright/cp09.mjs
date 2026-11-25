// CP09 – RF09: cambio de contraseña
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const hash = async () => (await consulta("SELECT contraseña h FROM usuario WHERE nombreUsuario = 'Vendedor'"))[0].h;

async function abrirCambio() {
  await page.goto(APP + '/inicio');
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(APP + '/inicio');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.getByRole('button', { name: 'CAMBIAR CONTRASEÑA' }).click();
  await page.waitForSelector('#cambio-usuario');
}
async function intentar(actual, nueva) {
  await page.fill('#cambio-usuario', 'Vendedor');
  await page.fill('#cambio-actual', actual);
  await page.fill('#cambio-nueva', nueva);
  await page.fill('#cambio-confirmar', nueva);
  await page.getByRole('button', { name: 'ACTUALIZAR' }).click();
  await page.waitForTimeout(1500);
  return page.evaluate(() => ({
    error: document.querySelector('.mensaje-error')?.innerText.trim() || '',
    exito: document.querySelector('.mensaje-exito')?.innerText.trim() || ''
  }));
}

try {
  const h0 = await hash();

  // 1. Ingresar a Iniciar sesión > Cambiar contraseña
  await abrirCambio();
  capturas.push(await captura(page, 'CP09', '1_formulario_cambio'));

  // 2. Actual incorrecta (abc) y nueva válida
  const r2 = await intentar('abc', 'Ferre2026');
  capturas.push(await captura(page, 'CP09', '2_actual_incorrecta'));
  const h2 = await hash();

  // 3. Actual correcta y nueva corta (ab1)
  await abrirCambio();
  const r3 = await intentar('123', 'ab1');
  capturas.push(await captura(page, 'CP09', '3_nueva_corta'));
  const h3 = await hash();

  // 4. Actual correcta y nueva válida
  await abrirCambio();
  const r4 = await intentar('123', 'Ferre2026');
  capturas.push(await captura(page, 'CP09', '4_cambio_exitoso'));
  const h4 = await hash();

  // 5. Cerrar sesión e iniciar con la nueva contraseña
  await login(page, 'Vendedor', 'Ferre2026');
  let entro = false;
  try { await page.waitForURL('**/dashboard', { timeout: 5000 }); entro = true; } catch { }
  capturas.push(await captura(page, 'CP09', '5_login_con_nueva'));

  obs.push(`Paso 2 (actual "abc"): mensaje "${r2.error}"; contraseña en BD ${h2 === h0 ? 'sin cambios' : 'CAMBIÓ'}.`);
  obs.push(`Paso 3 (nueva "ab1"): mensaje "${r3.error}"; contraseña en BD ${h3 === h0 ? 'sin cambios' : 'CAMBIÓ'}.`);
  obs.push(`Paso 4 (nueva "Ferre2026"): mensaje "${r4.exito || r4.error}"; contraseña en BD ${h4 !== h0 ? 'actualizada (hash BCrypt nuevo)' : 'sin cambios'}.`);
  obs.push(`Paso 5: inicio de sesión con "Ferre2026" ${entro ? 'exitoso (dashboard del Vendedor)' : 'FALLÓ'}.`);

  const aprobado = r2.error && h2 === h0 && r3.error.includes('8 caracteres') && h3 === h0
    && r4.exito.includes('correctamente') && h4 !== h0 && entro;
  guardarResultado('CP09', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Actual incorrecta: rechazado ("${r2.error}"). Nueva corta: rechazado ("${r3.error}"). Datos correctos: "${r4.exito}". Inicio de sesión con la nueva contraseña ${entro ? 'exitoso' : 'fallido'}.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP09', 'error'));
  guardarResultado('CP09', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
