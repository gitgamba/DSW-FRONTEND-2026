// Para mostrar fechas e importes de la API. Las fechas se formatean con Intl.DateTimeFormat
// (nativo, no depende del navegador ni del sistema operativo) y nunca cortando texto.

// La API manda las fechas sin hora a medianoche UTC ("2026-11-10T00:00:00.000Z"): se leen en UTC,
// si no en Argentina (UTC-3) se verían como el día anterior.
// "Hoy" en cambio se calcula en la hora de Argentina, aunque la computadora tenga otra zona configurada.
export const ZONA_ARGENTINA ='America/Argentina/Buenos_Aires';

const DIA_MES_ANIO = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
const DIA_MES = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
const NOMBRE_DIA = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', weekday: 'long' });

// Date → "AAAA-MM-DD" (el formato de la API y de los <input type="date">) en la zona indicada.
// formatToParts devuelve día, mes y año por separado, sin depender del orden en que los escribe cada idioma.
export function aFechaISO(fecha: Date, zona = 'UTC') {
  const partes = new Intl.DateTimeFormat('en', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(fecha);
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}

// "2026-11-10T00:00:00.000Z" → "10/11/2026"
export function formatearFecha(iso: string) {
  return DIA_MES_ANIO.format(new Date(iso));
}

// "2026-11-10T00:00:00.000Z" → "2026-11-10"
export function fechaParaInput(iso: string | null) {
  return iso ? aFechaISO(new Date(iso)) : '';
}

// La fecha de hoy en Argentina, en "AAAA-MM-DD"
export function hoy() {
  return aFechaISO(new Date(), ZONA_ARGENTINA);
}

// "2026-11-10" + 3 días → "2026-11-13"
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(fecha); // "AAAA-MM-DD" se lee como medianoche UTC
  d.setUTCDate(d.getUTCDate() + dias);
  return aFechaISO(d);
}

// "2026-11-10" → "Martes 10/11"
export function diaConNombre(fecha: string) {
  const d = new Date(fecha);
  const nombre = NOMBRE_DIA.format(d);
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${DIA_MES.format(d)}`;
}

// "50000.00" → "$ 50.000,00"
export function formatearImporte(importe: string | null, moneda = 'ARS') {
  if (importe === null) return '—';
  try {
    return Number(importe).toLocaleString('es-AR', { style: 'currency', currency: moneda });
  } catch {
    // toLocaleString falla con un código que no existe (por ejemplo "ABC", que la API acepta)
    return `${moneda} ${importe}`;
  }
}
