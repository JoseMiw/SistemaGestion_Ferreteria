// CP07 – RF07: registro y actualización de clientes
import { abrirNavegador, captura, login, consulta, ahora, guardarResultado, APP } from './comun.mjs';

const { browser, page } = await abrirNavegador();
const inicio = ahora();
const capturas = [];
const obs = [];
const contar = async () => (await consulta('SELECT COUNT(*) n FROM cliente'))[0].n;

async function nuevoCliente(d) {
  await page.goto(APP + '/dashboard/clientes');
  await page.getByRole('button', { name: 'Nuevo Cliente' }).click();
  await page.waitForSelector('#cli-dni');
  await page.fill('#cli-dni', d.dni);
  await page.fill('#cli-nombres', d.nombres);
  await page.fill('#cli-apellidos', d.apellidos);
  await page.fill('#cli-telefono', d.telefono);
  await page.fill('#cli-correo', d.correo);
}
const guardar = async () => { await page.getByRole('button', { name: 'Guardar Cliente' }).click(); await page.waitForTimeout(1200); };
const errores = () => page.evaluate(() => ({
  marcados: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.id),
  mensajes: [...document.querySelectorAll('[role=alert]')].map(e => e.innerText.trim()).filter(Boolean)
}));

try {
  await login(page, 'Vendedor', '123');
  await page.waitForURL('**/dashboard');

  // 1-2. Clientes > Nuevo cliente con datos válidos
  const n0 = await contar();
  await nuevoCliente({ dni: '70123456', nombres: 'Carlos', apellidos: 'Mendoza', telefono: '987000111', correo: 'carlos.mendoza@email.com' });
  capturas.push(await captura(page, 'CP07', '1_nuevo_cliente_lleno'));
  await guardar();
  await page.waitForURL('**/dashboard/clientes');
  capturas.push(await captura(page, 'CP07', '2_cliente_registrado'));
  const creado = (await consulta("SELECT idCliente, DNI, nombres, apellidos, telefono, correo FROM cliente WHERE DNI = '70123456'"))[0];
  obs.push(`Registro: BD ${creado ? `cliente N° ${creado.idCliente} ${creado.nombres} ${creado.apellidos}, DNI ${creado.DNI}, teléfono ${creado.telefono}, correo ${creado.correo}` : 'sin registro'}.`);

  // 3. Editar el cliente y cambiar el teléfono
  await page.fill('#cli-buscar-campo-1', '70123456');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.waitForSelector('table tbody tr:has-text("70123456")');
  capturas.push(await captura(page, 'CP07', '3a_cliente_buscado_por_dni'));
  await page.getByRole('button', { name: 'Editar' }).click();
  await page.waitForFunction(() => document.querySelector('#cli-dni')?.value === '70123456');
  await page.fill('#cli-telefono', '987000222');
  capturas.push(await captura(page, 'CP07', '3b_editar_telefono'));
  await guardar();
  await page.waitForURL('**/dashboard/clientes');
  const editado = (await consulta("SELECT telefono FROM cliente WHERE DNI = '70123456'"))[0];
  capturas.push(await captura(page, 'CP07', '3c_edicion_guardada'));
  obs.push(`Edición: teléfono en BD ${editado?.telefono}.`);

  // 4. Intentar registrar otro cliente con DNI "123"
  const n1 = await contar();
  await nuevoCliente({ dni: '123', nombres: 'Ana', apellidos: 'Prueba', telefono: '987000333', correo: 'ana.prueba@email.com' });
  await guardar();
  const eDni = await errores();
  capturas.push(await captura(page, 'CP07', '4_dni_invalido'));
  const noGuardadoDni = (await contar()) === n1;

  // 5. Intentar registrar otro cliente con nombres vacíos
  await nuevoCliente({ dni: '70999888', nombres: '', apellidos: 'Prueba', telefono: '987000444', correo: 'sin.nombre@email.com' });
  await guardar();
  const eNom = await errores();
  capturas.push(await captura(page, 'CP07', '5_nombres_vacios'));
  const noGuardadoNom = (await contar()) === n1;

  obs.push(`DNI "123": ${noGuardadoDni ? 'no se guardó' : 'SE GUARDÓ'}; campo marcado: ${eDni.marcados.join(', ') || 'ninguno'}; mensajes: "${eDni.mensajes.join(' | ')}".`);
  obs.push(`Nombres vacíos: ${noGuardadoNom ? 'no se guardó' : 'SE GUARDÓ'}; campo marcado: ${eNom.marcados.join(', ') || 'ninguno'}; mensajes: "${eNom.mensajes.join(' | ')}".`);

  const aprobado = !!creado && (await contar()) === n0 + 1 && editado?.telefono === '987000222'
    && noGuardadoDni && eDni.marcados.includes('cli-dni') && noGuardadoNom && eNom.marcados.includes('cli-nombres');

  guardarResultado('CP07', {
    fecha: inicio, estado: aprobado ? 'Aprobado' : 'Fallido',
    obtenido: `Cliente Carlos Mendoza (DNI 70123456) ${creado ? 'registrado' : 'NO registrado'}; teléfono actualizado a ${editado?.telefono}. DNI "123" ${noGuardadoDni ? 'rechazado' : 'aceptado'} con el campo DNI marcado; nombres vacíos ${noGuardadoNom ? 'rechazado' : 'aceptado'} con el campo Nombres marcado.`,
    observaciones: obs.join(' '), capturas
  });
  console.log(aprobado ? 'APROBADO' : 'FALLIDO'); console.log(obs.join('\n'));
} catch (e) {
  console.log('ERROR', e.message);
  capturas.push(await captura(page, 'CP07', 'error'));
  guardarResultado('CP07', { fecha: inicio, estado: 'Error de ejecución', obtenido: e.message, observaciones: obs.join(' '), capturas });
} finally { await browser.close(); }
