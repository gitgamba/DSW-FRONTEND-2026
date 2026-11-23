# Preparar una PC para desarrollar y ejecutar las pruebas

Esta guía permite preparar el frontend desde un clon nuevo, ejecutar el test de componente y preparar el E2E con API local real. Los ejemplos usan PowerShell en Windows y se ejecutan desde la raíz del frontend, salvo el paso de clonado.

La [consigna del TP](https://github.com/gitgamba/DSW-303-2026/blob/main/README.md#33-entregas) pide instrucciones de instalación y ejecución, y evidencia de los tests para aprobación. La [propuesta](https://github.com/gitgamba/DSW-303-2026/blob/main/proposal.md) incluye componente con Vitest y E2E con Playwright. Esta guía explica cómo repetirlos; los resultados se registran después de ejecutarlos.

## 1. Comprobar las herramientas

Instalar [Git](https://git-scm.com/downloads) y [Node.js](https://nodejs.org/en/download) seleccionando **24.x**, la rama requerida por ambos `package.json`. Node incluye npm; la versión usada en la verificación histórica del equipo es **24.22.2**.

Abrir una terminal nueva y comprobar:

```powershell
git --version
node --version
npm --version
```

Los tres comandos deben existir y Node debe mostrar `v24.x.x`. No hace falta instalar Vite, TypeScript, Vitest ni Playwright globalmente.

Si aparece otra versión de Node, comprobar qué ejecutable usa la terminal:

```powershell
Get-Command node,npm | Select-Object Name,Source
```

Si ya se usa [fnm](https://github.com/Schniz/fnm), se puede instalar la versión del equipo y ejecutar cada comando con ella sin cambiar la versión predeterminada:

```powershell
fnm install 24.22.2
fnm exec --using 24.22.2 node --version
fnm exec --using 24.22.2 npm.cmd --version
```

En ese caso, usar el mismo prefijo `fnm exec --using 24.22.2` para los demás comandos, incluida la instalación de dependencias y Chromium; con npm/npx en Windows se pueden usar `npm.cmd` y `npx.cmd`.

## 2. Clonar e instalar

Para el E2E, los repositorios deben estar uno junto al otro, con estos nombres:

```text
carpeta-de-trabajo/
  DSW-BACKEND-2026/
  DSW-FRONTEND-2026/
  .playwright-browsers/  (se crea al instalar Chromium)
```

Desde la carpeta de trabajo, clonar los que todavía no existan:

```powershell
git clone https://github.com/gitgamba/DSW-BACKEND-2026.git
git clone https://github.com/gitgamba/DSW-FRONTEND-2026.git
Set-Location DSW-FRONTEND-2026
npm ci
```

`npm ci` instala las dependencias del lockfile, incluidas las herramientas de desarrollo y test. No usar `--omit=dev`. [Referencia de npm](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

Para ejecutar la aplicación manualmente, en un clon nuevo copiar `.env.example` a `.env`. Si ya existe, conservarlo. En local, configurar `VITE_API_URL=http://localhost:3000/api`, sin barra final. Las variables `VITE_*` son públicas: no poner contraseñas ni secretos allí.

## Pruebas

| Objetivo | Comando | Qué necesita |
| --- | --- | --- |
| Comprobar tipos | `npm run check` | Dependencias del frontend. |
| Test de componente | `npm test` | Vitest y jsdom; la API está mockeada. |
| Compilación | `npm run build` | Dependencias y configuración del frontend. |
| E2E | `npm run test:e2e` | Frontend, backend local, Chromium, base real y administrador de pruebas. |

### 3. Test de componente

```powershell
npm run check
npm test
npm run build
```

`TipoUsuarioForm.test.tsx` verifica validación, envío de descripción/rol base y manejo de conflictos. No necesita API levantada, acceso a Azure ni Chromium. `vitest.config.ts` define la URL de prueba y el mock impide llamar a la API real.

### 4. Preparar el backend para el E2E

Completar la [guía del backend](https://github.com/gitgamba/DSW-BACKEND-2026/blob/main/docs/desarrollo-y-pruebas.md). En la copia local está en `../DSW-BACKEND-2026/docs/desarrollo-y-pruebas.md`.

Antes de seguir, comprobar:

- Dependencias del backend instaladas con `npm ci` y cliente generado con `npx prisma generate`, ambos desde el backend.
- `.env` del backend completo, con `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` y las tres variables `STAYS_*`. La API valida Stays al arrancar aunque el E2E no sincronice reservas.
- Base autorizada accesible, esquema actualizado e IP pública de la conexión habilitada en Azure. Conservar `connectTimeout=90;poolTimeout=90`.
- Un administrador existente con credenciales vigentes y un tipo de usuario con `rolBase=Supervisor` (el recorrido lo utiliza para crear su supervisor de prueba).
- Puertos **3000 y 5173 libres**. No levantar manualmente los servidores para este test.

El E2E usa `E2E_ADMIN_NOMBRE` y `E2E_ADMIN_PASSWORD` si están definidos; si no, usa `SEED_ADMIN_NOMBRE` y `SEED_ADMIN_PASSWORD` del `.env` del backend. Se puede crear `.env.e2e` en el frontend con las dos variables `E2E_ADMIN_*`; está ignorado por Git. Completar los valores por un canal privado. Declarar esas variables no crea un usuario ni cambia su contraseña.

La conexión de la API a Azure depende de la IP pública de la red, aunque la API esté en localhost. Si cambia de PC en la misma red, normalmente conserva esa IP; si cambia de red o usa otra salida por VPN, comprobar la IP que indica Azure. No ejecutar migraciones ni seed como rutina de preparación de otra PC: coordinar cualquier cambio pendiente de la base compartida.

Para consultar qué proceso ocupa esos puertos en Windows:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000,5173 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

Si no muestra filas, no hay listeners en esos puertos. Si muestra alguno, identificar el proceso y detener solamente el servidor de desarrollo correspondiente, normalmente con Ctrl+C en su terminal.

### 5. Instalar Chromium

Desde el frontend, usar la misma ubicación que `playwright.config.ts`:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Resolve-Path ..) '.playwright-browsers'
npx playwright install chromium
npx playwright install --list
```

El navegador de uso diario no reemplaza los binarios que instala Playwright. Si cambia la versión de Playwright al actualizar dependencias, puede ser necesario repetir la instalación de Chromium. [Referencia](https://playwright.dev/docs/browsers#managing-browser-binaries).

### 6. Ejecutar el E2E

Para comprobar primero que Playwright carga la configuración y encuentra el test:

```powershell
npm run test:e2e -- --list
```

Esto **solo lista** los tests; no ejecuta el recorrido, no levanta los servidores ni comprueba el acceso a Azure, el login o el navegador.

Para ejecutar el recorrido real:

```powershell
npm run test:e2e
```

La configuración levanta la API en `http://localhost:3000` y Vite en `http://localhost:5173`, define el CORS y la URL de API locales y detiene ambos procesos al terminar. Se ejecuta un recorrido con un worker. No cambiar estas URLs por las de producción.

El test crea, modifica y elimina registros con el prefijo reservado **`E2E-DSW-`** en la base configurada del backend. Limpia esos fixtures al comenzar y al terminar; no usar ese prefijo para datos propios ni ejecutar dos E2E simultáneamente contra esa base. Si se interrumpe la ejecución, repetir el mismo test cuando se resuelva el problema permite limpiar sus restos reservados.

El recorrido cubre formularios, sesión con F5, permisos, creación de una reserva, baja/recuperación de un movimiento, asignación como Supervisor y notificación/realización como Operador. También comprueba tamaños de pantalla. El health usado para esperar el arranque de la API no consulta SQL; el login inicial es el que comprueba el acceso a la base y las credenciales.

## Errores frecuentes

| Mensaje o síntoma | Comprobación y solución |
| --- | --- |
| `node` o `npm` no se reconoce | Instalar Node 24 y abrir una terminal nueva. |
| PowerShell bloquea `npm.ps1` | Usar `npm.cmd` y `npx.cmd` para los mismos comandos. |
| `EBADENGINE` o `process.loadEnvFile is not a function` | Comprobar `node --version` en la terminal que corre el E2E; debe ser 24.x. |
| No se encuentra Vite, Vitest o Playwright | Ejecutar `npm ci` desde el frontend con las dependencias de desarrollo. |
| No se encuentra el backend | Clonar ambos repos como carpetas hermanas, con los nombres indicados. |
| Prisma Client no está generado | Ejecutar `npx prisma generate` desde el backend. |
| Playwright informa que falta el ejecutable del navegador | Repetir el paso de instalación de Chromium con la misma `PLAYWRIGHT_BROWSERS_PATH`. |
| `http://localhost:3000` o `:5173` ya está en uso | Detener el servidor de desarrollo identificado; Playwright necesita iniciar sus propios procesos. |
| La API no arranca y enumera variables inválidas | Completar el `.env` del backend, incluidas las variables de Stays. |
| Error 40615 de Azure y login con 500 | Agregar la IP pública exacta indicada en el error a las reglas del servidor SQL; esperar hasta cinco minutos. [Referencia de Azure](https://learn.microsoft.com/en-us/azure/azure-sql/database/firewall-configure?view=azuresql). |
| El login inicial devuelve 401 | Comprobar las credenciales del administrador existente, incluidas las variables `E2E_ADMIN_*` que tengan prioridad. |
| Timeout al conectar con SQL | Comprobar acceso a Azure y los parámetros de timeout; la base puede estar despertándose. |

## Evidencia para la entrega

Después de ejecutar las pruebas, registrar fecha, commit de ambos repos (`git rev-parse --short HEAD` en cada uno), versiones de Node/npm, comandos, cantidad de casos y resultados. Diferenciar `npm test` de `npm run test:e2e`; listar los tests o compilar no demuestra que el E2E pasó.

Playwright deja resultados locales en `test-results/`, ignorado por Git. Revisar antes de compartir capturas o errores y publicar solo evidencia sin credenciales, tokens ni datos personales. El recorrido guarda capturas de formularios vacíos; las trazas y videos están desactivados. Enlazar la evidencia revisada desde `docs/README.md` cuando corresponda a la entrega. No presentar resultados históricos como una ejecución nueva.

## Ejecución manual y despliegue

Para usar la app local manualmente, levantar el backend y luego `npm run dev` en el frontend, con sus `.env` configurados. El despliegue en Vercel se documenta en el [README](../README.md#deploy-vercel). Preparar los tests en otra PC no requiere desplegar ni hacer push.

Para usar solamente la aplicación publicada, abrir su URL e iniciar sesión: el navegador llama a Render y es Render quien accede a Azure. Ese uso no requiere instalar las herramientas de desarrollo ni habilitar la IP de la PC en SQL.
