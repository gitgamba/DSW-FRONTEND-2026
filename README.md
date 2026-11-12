# DSW Frontend 2026

Frontend del sistema de gestión de la agenda de operadores de una empresa de hospedaje (TP de Desarrollo de Software, UTN FRRO). Consume la API de [DSW-BACKEND-2026](../DSW-BACKEND-2026).

Usa React 19, Vite, TypeScript, React Router, react-bootstrap (Bootstrap 5) y FullCalendar 7 para el calendario.

[Documentación](docs/README.md) · [Preparar otra PC y ejecutar las pruebas](docs/desarrollo-y-pruebas.md) · [Despliegue en Vercel](#deploy-vercel)

## Requisitos

- Node.js 24 (el mismo que el backend)
- El backend corriendo (en local o en Render)

## Instalación

```bash
npm ci
```

Copiá `.env.example` a `.env`. El `.env` no se sube al repo.
La [guía de desarrollo y pruebas](docs/desarrollo-y-pruebas.md) incluye la comprobación de Node, instalación de Chromium y configuración del backend local para el E2E.

| Variable | Para qué |
|:-|:-|
| `VITE_API_URL` | URL base de la API, con `/api` y sin barra final. En local, `http://localhost:3000/api` (o el `PORT` que tenga el `.env` del back) |

Vite solo expone al navegador las variables que empiezan con `VITE_`, y las mete en el código al compilar: **no poner secretos acá**, cualquiera los puede leer.

## Ejecución contra el backend local

1. En la carpeta del back: `npm run dev` (queda en `http://localhost:3000`).
2. En esta carpeta: `npm run dev` y abrir `http://localhost:5173`.
3. Entrar con el administrador que creó el seed del back (`SEED_ADMIN_NOMBRE` / `SEED_ADMIN_PASSWORD` de su `.env`).

El front usa siempre el puerto **5173** (`strictPort` en `vite.config.ts`): es el único origen que el back acepta por CORS (`CORS_ORIGIN`). Si el puerto está ocupado, Vite falla en vez de elegir otro, porque con otro puerto todas las llamadas darían error de CORS.

> La base de Azure se pausa después de una hora sin uso. Si el primer login da *"El servidor tuvo un problema"*, esperar un minuto y volver a intentar.

```bash
npm run dev      # desarrollo: recarga al guardar
npm run check    # solo chequea tipos
npm run build    # chequea tipos y genera dist/
npm run preview  # sirve lo de dist/
```

## Estructura

```
index.html                 la única página (SPA); tiene el meta viewport para mobile
src/
  main.tsx                 arranca React: BrowserRouter + AuthProvider + App
  App.tsx                  las rutas y qué roles entran a cada una
  api.ts                   apiFetch: todas las llamadas a la API (token + errores amigables)
  AuthContext.tsx          sesión: usuario, rol, token, login() y logout()
  useFetch.ts              custom hook para traer datos con loading/error/cargar
  types.ts                 tipos de los datos de la API
  formato.ts               mostrar fechas e importes (y la fecha de hoy)
  components/
    Layout.tsx             Navbar con el menú según el rol, el contador de no leídas y el contenido de cada página
    RutaProtegida.tsx      manda al login sin sesión y bloquea si el rol no corresponde
  pages/
    Login.tsx
    Inicio.tsx
    Usuarios.tsx           CRUD de usuarios: listado + baja con confirmación
    UsuarioForm.tsx        alta y edición de un usuario (modal)
    Reservas.tsx           listado con filtros (en la URL) + botones de alta y sincronizar
    ReservaDetalle.tsx     /reservas/:id: datos, huéspedes y movimientos; editar y borrar
    ReservaForm.tsx        alta y edición de una reserva (modal)
    SincronizarModal.tsx   trae las reservas de Stays en un rango de fechas
    Movimientos.tsx        planilla de check-ins y check-outs: asignar operador desde cada fila
    NotaModal.tsx          la nota de un movimiento
    Agenda.tsx             pestañas Lista / Calendario + filtro de operador (no para Operador)
    AgendaLista.tsx        próximos 7 días, agrupados por día
    AgendaCalendario.tsx   FullCalendar (mes y semana)
    MovimientoModal.tsx    detalle de un movimiento + "Marcar como hecho" (lo usan las dos vistas)
    Notificaciones.tsx     mis avisos de asignación; tocar uno lo marca leído y lleva a la Agenda
```

### Cómo funciona

- **Sesión.** El login (`POST /auth/login`) devuelve el token y el usuario, que se guardan en `localStorage` para que la sesión sobreviva al F5. El permiso viene de tipoUsuario.rolBase; el nombre del puesto no determina el acceso. Si el token guardado ya venció, la primera llamada a la API responde 401 y se vuelve al login.
  - Tradeoff elegido: `localStorage` lo puede leer cualquier script de la página, así que un XSS podría robar el token. React escapa todo lo que mostramos y no usamos `dangerouslySetInnerHTML`, así que el riesgo es bajo; a cambio no hay que loguearse en cada recarga.
- **Llamadas a la API.** Todas pasan por `apiFetch` (`src/api.ts`), que agrega `Authorization: Bearer <token>` y convierte los errores de la API (`{ error, detalle? }`) en mensajes para mostrar. Si la API responde `401` con un token, la sesión venció: se borra y se vuelve al login con el aviso *"Tu sesión venció"*.
- **Permisos.** Las rutas y el menú se filtran por rol solo para que cada uno vea lo suyo. Quien controla de verdad es la API (`401`/`403`): ocultar un botón no es seguridad.
- **Responsive (mobile-first).** Se diseña para el celular y se agrega lo que entra en pantallas más grandes:
  - Navbar: hamburguesa en celular y tablet, en línea desde `lg`.
  - Login: todo el ancho en el celular, `sm` 8 columnas, `md` 6, `lg` 4.
  - Usuarios: en el celular el tipo va debajo del nombre y el botón *Nuevo usuario* ocupa todo el ancho; desde `sm` aparece la columna Tipo y desde `md` la del id. El formulario ocupa toda la pantalla en el celular (`fullscreen="sm-down"`).
  - Reservas: en el celular las fechas de entrada y salida van en la misma celda y el inmueble debajo del titular; desde `md` el inmueble tiene su columna. Los filtros van uno por fila (las fechas de a dos) y desde `lg` todos en una fila. En el detalle, las tarjetas van una abajo de la otra y desde `lg` de a dos.
- **Fechas.** La API manda las fechas como `"2026-11-10T00:00:00.000Z"`. Se muestran cortando el texto (`formato.ts`) y no con `new Date()`, porque esa medianoche UTC en Argentina es el día anterior.
- **Filtros de Reservas en la URL** (`?desde=...&inmuebleId=...`, con `useSearchParams`): al volver del detalle con *Atrás*, el listado sigue filtrado. Sin `desde` en la URL se muestran de hoy en adelante; *Limpiar* muestra todas. El filtro por operador solo lo ve el Administrador, porque `GET /usuarios` es solo suyo.
- **Movimientos: asignar sin recargar.** Al elegir un operador se guarda en el momento (`PATCH /movimientos/:id/asignar`) y se cambia solo esa fila con `setData` de `useFetch`, así la lista no parpadea ni pierde el scroll. Si la API rechaza el cambio, el desplegable vuelve solo al operador anterior, porque se dibuja con los datos y esos no cambiaron.
- **Agenda.** Usa `GET /movimientos/agenda`, que ya trae una fila por movimiento con su fecha y hora. La lista pide de hoy a 6 días después; el calendario pide el rango que muestra, que FullCalendar avisa con `datesSet` (mientras no lo avisa, `useFetch` recibe `null` y no pide nada). Las pestañas se desmontan al salir (`unmountOnExit`), así lo que se marca como hecho en una aparece en la otra. *Marcar como hecho* no manda fecha: la API guarda la hora de ahora. Operador ve solo lo suyo porque lo filtra la API, no el front.
- **Notificaciones.** El contador del Navbar (`GET /notificaciones/mias?noLeidas=true`) se vuelve a pedir cada vez que cambia la pantalla (`useEffect` con `location.pathname`), no cada tantos segundos. La pantalla de Notificaciones, que no cambia de ruta al marcar todas, le pide al Layout que recuente con la función que este le pasa por `<Outlet context>`. En celular el contador va al lado de la hamburguesa, porque el menú está cerrado. *Marcar todas* hace un `PATCH` por cada una con `Promise.all` (la API no tiene uno para todas).

### Patrón para las próximas pantallas

`Usuarios.tsx` + `UsuarioForm.tsx` son el modelo a copiar:

1. Traer el listado con `useFetch<Tipo[]>('/ruta')` y mostrar `Spinner` mientras carga y un `Alert` con *Reintentar* si falla.
2. Alta y edición en un modal que se monta al abrirse (el estado arranca de cero). Validar en el front con las mismas reglas que el schema de Zod del back, mostrar cada error bajo su campo (`isInvalid` + `Form.Control.Feedback`) y lo que solo sabe la API (valor repetido, `409`) en un `Alert` arriba del formulario.
3. Baja con un modal de confirmación.
4. Después de guardar o borrar: `cargar()` y un `Alert` verde con lo que pasó.
5. Agregar la ruta en `App.tsx` y la opción en el `MENU` de `Layout.tsx`, con los mismos roles que la API.

## Estado de las pantallas

Lo hecho y lo que falta:

- [x] **Reservas** (Administrador, Supervisor): listado con filtros, detalle, alta/edición/baja (Administrador).
- [x] **Sincronización con Stays** (Administrador): botón en Reservas con rango de fechas y el resumen.
- [x] **Movimientos** (Administrador, Supervisor): planilla por fecha, asignar/desasignar operador (usa `GET /usuarios/operadores`, que devuelve solo los de Operador y Supervisor) y nota.
- [x] **Agenda** (todos; Operador solo lo suyo): próximos 7 días + calendario de mes y semana, marcar como hecho.
- [ ] Reactivación de cancelados: fuera del alcance. La API los mantiene bloqueados para edición, asignación y realización.
- [x] **Notificaciones** (todos): las mías, marcar como leída (una o todas), contador de no leídas en el Navbar.
- [x] Inmuebles, huéspedes y tipos de usuario: CRUD administrativos preparados localmente.
- [x] Deploy existente en Vercel. Las nuevas funciones locales requieren publicar backend y frontend actualizados.

## Deploy (Vercel)

El front son archivos estáticos (`npm run build` genera `dist/`): Vercel los compila y los sirve, sin un proceso Node corriendo. La API sigue en Render.

**Antes:** el back tiene que estar andando en Render (ver el README del back). Se necesita su URL, por ejemplo `https://dsw-backend-2026.onrender.com`.

Lo que ya tiene el repo para Vercel:

| Archivo | Para qué |
|:-|:-|
| `vercel.json` | Devuelve `index.html` en cualquier ruta. Sin esto, recargar (F5) en `/usuarios` da 404: en el servidor no existe ningún archivo `usuarios`, esa ruta la resuelve React Router en el navegador. Los archivos que sí existen (`/assets/...`) Vercel los sirve igual, porque los busca antes de aplicar la regla. |
| `package.json` → `engines.node` | Node 24, el mismo que en local y en Render |
| `package-lock.json` | Vercel instala exactamente esas versiones (incluye los binarios de Linux de Vite y TypeScript) |

### 1. Antes del push

```bash
npm run build
git status
```

En `git status` **no** tiene que aparecer el `.env` (está en el `.gitignore`).

### 2. Crear el proyecto

1. Subir el repo a GitHub (`git push`).
2. En [vercel.com](https://vercel.com): **Add New → Project**, conectar GitHub e importar `DSW-FRONTEND-2026`. El repo es de la cuenta de Emiliano: o lo importa él, o le da acceso a la app de Vercel.
3. Vercel detecta **Vite** solo: build `npm run build`, salida `dist`. No hay que cambiar nada.
4. En **Environment Variables** cargar:

   | Variable | Valor |
   |:-|:-|
   | `VITE_API_URL` | La URL de Render **con `/api` y sin barra final**: `https://dsw-backend-2026.onrender.com/api` |

5. **Deploy**. Vercel da la URL del front, por ejemplo `https://dsw-frontend-2026.vercel.app`.

> `VITE_API_URL` se mete en el código **al compilar**, no al abrir la página. Si después se cambia en Vercel → Settings → Environment Variables, hay que volver a deployar (Deployments → ⋯ → **Redeploy**) para que tome el valor nuevo.

### 3. Avisarle al back

En Render → el servicio → **Environment**, cambiar `CORS_ORIGIN` por la URL de Vercel, **con `https://` y sin barra final** (`https://dsw-frontend-2026.vercel.app`). Render redeploya solo. Mientras no se cambie, el navegador bloquea todas las llamadas a la API (error de CORS) y la app muestra *"No se pudo conectar con el servidor"*.

### 4. Verificar

1. Abrir la URL de Vercel e iniciar sesión con el admin. Si tarda: Render se duerme después de 15 minutos sin uso y la base de Azure después de una hora; el primer pedido puede tardar hasta un par de minutos. Esperar y reintentar.
2. Ir a **Usuarios** y apretar **F5**: tiene que seguir en la misma pantalla (prueba el `vercel.json`).
3. Si algo falla, abrir las herramientas del navegador (F12) → **Console** y **Network**:

   | Lo que se ve | Qué es |
   |:-|:-|
   | `blocked by CORS policy` | `CORS_ORIGIN` en Render no es exactamente la URL de Vercel (¿barra final? ¿`http` en vez de `https`?) |
   | Página en blanco y en la consola `Falta VITE_API_URL en el .env` | Falta `VITE_API_URL` en Vercel, o se cargó después del deploy: hacer Redeploy |
   | 404 al recargar una ruta | Falta `vercel.json` en el repo |
   | El login da *"El servidor tuvo un problema"* | El back no llega a la base: firewall de Azure o base pausada (ver el README del back) |

Cada `git push` a `main` vuelve a deployar el front solo.

## Funciones nuevas y pruebas

- Tipos de usuario, Inmuebles y Huéspedes tienen listado, detalle para edición, alta, modificación y baja. Solo Administrador accede a estas pantallas.
- El identificador es obligatorio: puede ser el ID de Stays o un código propio para un registro manual.
- Administrador y Supervisor recuperan movimientos faltantes desde el detalle de Reserva y pueden borrarlos con confirmación. La baja elimina su notificación.
- La agenda consulta el detalle del movimiento al abrirlo y muestra cuándo se realizó.
- Sesiones antiguas sin rolBase o con datos ilegibles se descartan: volver a iniciar sesión.
- El menú colapsa hasta xxl para que las ocho opciones administrativas entren sin desbordarse.
- Los tests del frontend son OBLIGATORIOS para aprobación: `npm test` (componente) y `npm run test:e2e` (navegador + API local real).
- Para E2E, instalar Chromium con `npx playwright install chromium`, definiendo PLAYWRIGHT_BROWSERS_PATH al directorio hermano .playwright-browsers como hace la configuración. No iniciar servidores manualmente: el test levanta puertos 3000 y 5173.
- Las credenciales se leen del .env ignorado del backend (SEED_ADMIN_*) o de variables E2E_ADMIN_NOMBRE/E2E_ADMIN_PASSWORD. Se puede usar un archivo .env.e2e ignorado con esas dos variables. Nunca se incluyen en código ni reportes.
- El E2E está limitado a URLs locales, corre en serie, crea fixtures E2E-DSW- y los borra al comienzo y al final. La base sigue siendo la del equipo: habilitar la IP pública de la conexión y comprobar que el esquema esté actualizado. Coordinar cualquier migración pendiente; no ejecutarla como parte rutinaria de la preparación de otra PC.
- [Preparar la PC, ejecutar los tests y resolver errores](docs/desarrollo-y-pruebas.md).
- [Documentación de este repositorio](docs/README.md) y [repositorio central de la propuesta y la entrega](https://github.com/gitgamba/DSW-303-2026). Confirmar por separado la publicación de la documentación académica complementaria.

Pruebas de componente (sin API ni Azure) y E2E (con API local y base real), desde este repositorio:

```powershell
npm test
npm run test:e2e
```

Antes del E2E, completar la preparación de la guía. El test levanta ambos servidores automáticamente.

Ejemplo de instalación del navegador para E2E en PowerShell, desde este repositorio:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Resolve-Path ..) '.playwright-browsers'
npx playwright install chromium
npm run test:e2e
```

Verificación local del 30/10/2026 con Node 24.22.2: check y build OK, 3 casos de
componente y 1 recorrido E2E real aprobados. Formularios revisados a 375/576/768/992 px.
Este resultado es histórico; una ejecución nueva debe registrar su propia [evidencia](docs/desarrollo-y-pruebas.md#evidencia-para-la-entrega).
