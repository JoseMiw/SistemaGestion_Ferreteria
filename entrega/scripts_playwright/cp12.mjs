// CP12 – RF08 / RNF01: credenciales incorrectas y bloqueo de cuenta
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const estadoBd = async () => (await consulta("SELECT intentosFallidos, bloqueadoHasta FROM usuario WHERE nombreUsuario = 'Almacenero'"))[0];
const mensaje = async () => {
  await page.waitForFunction(() => document.querySelector('#login-error')?.innerText.trim().length > 0, null, { timeout: 5000 });
  return page.evaluate(() => document.querySelector('#login-error').innerText.trim());
};

try {
  const e0 = await estadoBd();
  obs.push(`Precondición: Almacenero con ${e0.intentosFallidos} intentos fallidos y bloqueadoHasta ${e0.bloqueadoHasta ?? 'NULL'}.`);

  // 1. Usuario correcto con contraseña incorrecta (xyz)
  await login(page, 'Almacenero', 'xyz');
  const m1 = await mensaje();
  capturas.push(await captura(page, 'CP12', '1_clave_incorrecta'));
  const e1 = await estadoBd();

  // 2. Usuario inexistente
  await login(page, 'UsuarioInexistente', 'xyz');
  const m2 = await mensaje();
  capturas.push(await captura(page, 'CP12', '2_usuario_inexistente'));

  // 3. Repetir hasta completar cinco intentos fallidos consecutivos con el mismo usuario
  const intentos = [m1];
  for (let i = 2; i <= 5; i++) {
    await login(page, 'Almacenero', 'xyz');
    intentos.push(await mensaje());
  }
  capturas.push(await captura(page, 'CP12', '3_quinto_intento_bloqueo'));
  const e3 = await estadoBd();

  // 4. Iniciar sesión con la contraseña correcta
  await login(page, 'Almacenero', '123');
  const m4 = await mensaje();
  const entro = page.url().includes('/dashboard');
  capturas.push(await captura(page, 'CP12', '4_clave_correcta_bloqueada'));

  obs.push(`Intento 1 (Almacenero/xyz): "${m1}"; BD intentos ${e1.intentosFallidos}.`);
  obs.push(`Usuario inexistente: "${m2}" (mismo texto que con clave incorrecta: ${m1 === m2 ? 'sí' : 'NO'}).`);
  obs.push(`Intentos 2 a 5 con Almacenero: ${intentos.slice(1).map((m, i) => `${i + 2}° "${m}"`).join('; ')}.`);
  obs.push(`BD tras el 5° intento: intentos ${e3.intentosFallidos}, bloqueadoHasta ${e3.bloqueadoHasta ? new Date(e3.bloqueadoHasta).toLocaleString('es-PE') : 'NULL'}.`);
  obs.push(`Clave correcta durante el bloqueo: "${m4}"; ${entro ? 'ENTRÓ al sistema' : 'no entró al sistema'}.`);

  const minutos = e3.bloqueadoHasta ? Math.round((new Date(e3.bloqueadoHasta) - Date.now()) / 60000) : 0;
  const aprobado = m1 === 'Usuario o contraseña incorrectos' && m1 === m2
    && intentos.slice(1, 4).every(m => m === m1) && intentos[4].includes('bloqueada')
    && e3.bloqueadoHasta && minutos >= 14 && minutos <= 15 && m4.includes('bloqueada') && !entro;
  guardarResultado('CP12', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Clave incorrecta y usuario inexistente mostraron el mismo mensaje genérico "${m1}". Al 5° intento fallido: "${intentos[4]}" (bloqueo de ~${minutos} min registrado en BD). Con la contraseña correcta: "${m4}", sin acceso.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP12', 'error'));
  guardarResultado('CP12', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
