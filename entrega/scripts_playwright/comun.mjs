// Utilidades comunes para ejecutar los casos de prueba del plan (Playwright + consultas de solo lectura)
import { chromium } from 'playwright-core';
import mysql from 'mysql2/promise';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP = 'http://localhost:4200';
export const EVID = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'evidencias');
const RESULTADOS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'resultados.json');
mkdirSync(EVID, { recursive: true });

export async function abrirNavegador() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'es-PE' });
  const page = await context.newPage();
  // Las ventanas alert() nativas no salen en las capturas: se registra su texto
  page.__dialogos = [];
  page.on('dialog', async d => { page.__dialogos.push(d.message()); await d.accept(); });
  return { browser, page };
}

// Captura de evidencia: CPxx_paso.png
export async function captura(page, caso, paso) {
  const archivo = `${caso}_${paso}.png`;
  await page.screenshot({ path: `${EVID}/${archivo}`, fullPage: true });
  return archivo;
}

export async function login(page, usuario, clave) {
  await page.goto(APP + '/inicio');
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(APP + '/inicio');
  await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click();
  await page.fill('#login-usuario', usuario);
  await page.fill('#login-password', clave);
  await page.click('form.login-modal button[type=submit]');
}

export async function cerrarSesion(page) {
  await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
  await page.waitForURL('**/inicio');
}

// Consultas de SOLO LECTURA a la base de pruebas
export async function consulta(sql, params = []) {
  if (!/^\s*select/i.test(sql)) throw new Error('Solo se permiten consultas SELECT');
  const cn = await mysql.createConnection({ host: 'localhost', user: 'root', password: process.env.MYSQL_PASSWORD, database: 'ferreteria_bd_pruebas' });
  const [filas] = await cn.query(sql, params);
  await cn.end();
  return filas;
}

export function ahora() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Guarda el resultado del caso en resultados.json
export function guardarResultado(caso, datos) {
  const todos = existsSync(RESULTADOS) ? JSON.parse(readFileSync(RESULTADOS, 'utf8')) : {};
  todos[caso] = datos;
  writeFileSync(RESULTADOS, JSON.stringify(todos, null, 2), 'utf8');
}

export const texto = (page) => page.evaluate(() => document.body.innerText);
