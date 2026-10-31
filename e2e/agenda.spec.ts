import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Las URLs son locales deliberadamente: este test no se ejecuta contra producción.
const api = 'http://localhost:3000/api';
const prefijo = 'E2E-DSW-';
const nombreAdmin = process.env.E2E_ADMIN_NOMBRE || process.env.SEED_ADMIN_NOMBRE;
const passwordAdmin = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
const passwordOperador = randomUUID();
let autorizacion: { Authorization: string };

async function limpiar(request: APIRequestContext) {
  // Solo fixtures reservados. Borrar primero reservas elimina movimientos y avisos en cascada.
  for (const ruta of ['reservas', 'inmuebles', 'huespedes', 'usuarios', 'tipos-usuario']) {
    const respuesta = await request.get(api + '/' + ruta, { headers: autorizacion });
    expect(respuesta.ok(), 'No se pudo consultar la limpieza de ' + ruta).toBeTruthy();
    const registros = await respuesta.json();
    for (const registro of registros) {
      const identificador = ruta === 'usuarios' ? registro.nombre : ruta === 'tipos-usuario' ? registro.descripcion : registro.staysId;
      if (typeof identificador === 'string' && identificador.startsWith(prefijo)) {
        const baja = await request.delete(api + '/' + ruta + '/' + registro.id, { headers: autorizacion });
        expect(baja.status(), 'No se pudo limpiar un fixture de ' + ruta).toBe(204);
      }
    }
  }
}
async function ingresar(page: Page, nombre: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill(nombre);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:5173/');
}
async function salir(page: Page) {
  if (!await page.getByRole('button', { name: 'Salir', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
  }
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
}
test.beforeEach(async ({ request }) => {
  if (!nombreAdmin || !passwordAdmin) throw new Error('Configurar E2E_ADMIN_NOMBRE/E2E_ADMIN_PASSWORD o SEED_ADMIN_* fuera de Git.');
  const login = await request.post(api + '/auth/login', { data: { nombre: nombreAdmin, password: passwordAdmin }, timeout: 100_000 });
  expect(login.status(), 'El administrador de pruebas debe poder iniciar sesión').toBe(200);
  autorizacion = { Authorization: 'Bearer ' + (await login.json()).token };
  await limpiar(request);
});
test.afterEach(async ({ request }) => { if (autorizacion) await limpiar(request); });

test('administrar datos, asignar un movimiento y realizarlo como Operador', async ({ page, request }, testInfo) => {
  await ingresar(page, nombreAdmin!, passwordAdmin!);
  await page.goto('/usuarios');
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();

  // Revisar cada formulario sin datos personales en celular y en sm/md/lg.
  for (const [ruta, boton] of [['tipos-usuario', 'Agregar tipo de usuario'], ['inmuebles', 'Agregar inmueble'], ['huespedes', 'Agregar huésped']]) {
    await page.goto('/' + ruta);
    await page.getByRole('button', { name: boton, exact: true }).click();
    const modal = page.getByRole('dialog');
    for (const width of [375, 576, 768, 992]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(modal).toBeVisible();
      await expect(modal).toHaveCSS('opacity', '1');
      await expect(modal.locator('.modal-dialog')).toHaveCSS('transform', 'none');
      await expect(modal.getByRole('button', { name: 'Guardar', exact: true })).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      // Recortar el formulario; el listado de datos reales queda fuera de la evidencia.
      await modal.locator('.modal-content').screenshot({ path: testInfo.outputPath(ruta + '-' + width + '.png'), animations: 'disabled' });
    }
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }

  // Crear y editar un puesto con nombre distinto de su rol.
  await page.goto('/tipos-usuario');
  await page.getByRole('button', { name: 'Agregar tipo de usuario' }).click();
  await page.getByLabel('Descripción', { exact: true }).fill(prefijo + 'Recepción');
  await page.getByLabel('Rol base', { exact: true }).selectOption('Operador');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  const filaTipo = page.getByRole('row').filter({ hasText: prefijo + 'Recepción' });
  await filaTipo.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Descripción', { exact: true }).fill(prefijo + 'Recepción editada');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: prefijo + 'Recepción editada' })).toBeVisible();
  const tipos = await (await request.get(api + '/tipos-usuario', { headers: autorizacion })).json();
  const tipo = tipos.find((t: { descripcion: string }) => t.descripcion === prefijo + 'Recepción editada');
  const altaOperador = await request.post(api + '/usuarios', { headers: autorizacion,
    data: { nombre: prefijo + 'Operador', password: passwordOperador, tipoUsuarioId: tipo.id } });
  expect(altaOperador.status()).toBe(201);
  const operador = await altaOperador.json();

  await page.goto('/inmuebles');
  await page.getByRole('button', { name: 'Agregar inmueble' }).click();
  await page.getByLabel('Identificador (Stays o propio)', { exact: true }).fill(prefijo + 'INM');
  await page.getByLabel('Dirección', { exact: true }).fill(prefijo + 'Dirección de prueba');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: prefijo + 'Dirección de prueba' })).toBeVisible();
  const inmuebles = await (await request.get(api + '/inmuebles', { headers: autorizacion })).json();
  const inmueble = inmuebles.find((i: { staysId: string }) => i.staysId === prefijo + 'INM');
  await page.getByRole('row').filter({ hasText: prefijo + 'Dirección de prueba' }).getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Precio', { exact: true }).fill('123.45');
  await page.getByLabel('Capacidad', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: prefijo + 'Dirección de prueba' })).toContainText('2');

  await page.goto('/huespedes');
  await page.getByRole('button', { name: 'Agregar huésped' }).click();
  await page.getByLabel('Identificador (Stays o propio)', { exact: true }).fill(prefijo + 'HUE');
  await page.getByLabel('Apellido', { exact: true }).fill('Prueba');
  await page.getByLabel('Nombres', { exact: true }).fill(prefijo + 'Huésped');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: prefijo + 'Huésped' })).toBeVisible();
  const huespedes = await (await request.get(api + '/huespedes', { headers: autorizacion })).json();
  const huesped = huespedes.find((h: { staysId: string }) => h.staysId === prefijo + 'HUE');
  await page.getByRole('row').filter({ hasText: prefijo + 'Huésped' }).getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Teléfono', { exact: true }).fill('0000000000');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: prefijo + 'Huésped' })).toContainText('0000000000');
  const fecha = new Date().toISOString().slice(0, 10);
  const altaReserva = await request.post(api + '/reservas', { headers: autorizacion, data: {
    staysId: prefijo + 'RES', titular: prefijo + 'Reserva', inmuebleId: inmueble.id, huespedIds: [huesped.id],
    fechaInicio: fecha, horaInicio: '14:00', fechaFin: fecha, horaFin: '19:00',
  } });
  expect(altaReserva.status()).toBe(201);
  const reserva = await altaReserva.json();

  // La baja y el alta de un movimiento también se prueban desde su reserva.
  await page.goto('/reservas/' + reserva.id);
  await page.getByRole('row').filter({ hasText: 'Check-in' }).getByRole('button', { name: 'Borrar movimiento' }).click();
  await page.getByRole('button', { name: 'Confirmar borrado' }).click();
  await page.getByRole('button', { name: 'Agregar movimiento' }).click();
  await page.getByRole('button', { name: 'Crear movimiento' }).click();
  await expect(page.getByRole('button', { name: 'Agregar movimiento' })).toHaveCount(0);

  const supervisor = tipos.find((t: { rolBase: string }) => t.rolBase === 'Supervisor');
  const altaSupervisor = await request.post(api + '/usuarios', { headers: autorizacion,
    data: { nombre: prefijo + 'Supervisor', password: passwordOperador, tipoUsuarioId: supervisor.id } });
  expect(altaSupervisor.status()).toBe(201);
  await salir(page);
  await ingresar(page, prefijo + 'Supervisor', passwordOperador);
  await page.goto('/tipos-usuario');
  await expect(page.getByText('No tenés permiso para ver esta pantalla.')).toBeVisible();
  await page.goto('/movimientos');
  const selector = page.getByRole('combobox', { name: 'Operador del Check-in de ' + prefijo + 'Reserva', exact: true });
  await selector.selectOption(String(operador.id));
  await expect(page.getByText(/asignado a E2E-DSW-Operador/)).toBeVisible();
  await salir(page);
  await ingresar(page, prefijo + 'Operador', passwordOperador);
  await page.goto('/notificaciones');
  await page.getByText(/Te asignaron el check-in.*E2E-DSW-Dirección de prueba/).click();
  await expect(page).toHaveURL(/\/agenda$/);
  const detalle = page.waitForResponse(r => /\/api\/movimientos\/\d+$/.test(r.url()) && r.request().method() === 'GET');
  await page.getByText(prefijo + 'Reserva', { exact: false }).click();
  expect((await detalle).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Detalle del movimiento' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como hecho' }).click();
  await expect(page.getByText('REALIZADO', { exact: true })).toBeVisible();
  for (const width of [576, 768, 992]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  await page.goto('/usuarios');
  await expect(page.getByText('No tenés permiso para ver esta pantalla.')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await salir(page);
  await ingresar(page, nombreAdmin!, passwordAdmin!);
  await page.goto('/reservas/' + reserva.id);
  await page.getByRole('button', { name: 'Borrar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar', exact: true }).click();
  await expect(page).toHaveURL(/\/reservas$/);
  for (const [ruta, texto] of [['inmuebles', prefijo + 'Dirección de prueba'], ['huespedes', prefijo + 'Huésped']]) {
    await page.goto('/' + ruta);
    const fila = page.getByRole('row').filter({ hasText: texto });
    await fila.getByRole('button', { name: 'Borrar', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar borrado' }).click();
    await expect(fila).toHaveCount(0);
  }
  await page.goto('/usuarios');
  const filaOperador = page.getByRole('row').filter({ hasText: prefijo + 'Operador' });
  await filaOperador.getByRole('button', { name: 'Borrar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar', exact: true }).click();
  await expect(filaOperador).toHaveCount(0);
  await page.goto('/tipos-usuario');
  const tipoABorrar = page.getByRole('row').filter({ hasText: prefijo + 'Recepción editada' });
  await tipoABorrar.getByRole('button', { name: 'Borrar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar borrado' }).click();
  await expect(tipoABorrar).toHaveCount(0);
});
