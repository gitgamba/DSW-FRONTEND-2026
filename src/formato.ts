// Para mostrar fechas e importes de la API.

// "2026-11-10T00:00:00.000Z" → "10/11/2026".
// Se corta el texto en vez de usar new Date(): la fecha viene a medianoche UTC
// y en Argentina (UTC-3) se mostraría el día anterior.
export function formatearFecha(iso: string) {
  return iso.slice(0, 10).split('-').reverse().join('/');
}

// "2026-11-10T00:00:00.000Z" → "2026-11-10", el formato de los <input type="date">
export function fechaParaInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

// La fecha de hoy en "AAAA-MM-DD" según la hora de la computadora
// (toISOString daría la de UTC, que después de las 21 h ya es mañana)
export function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
// "2026-11-10" + 3 días → "2026-11-13"
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00`); // sin "Z": medianoche en la hora de la computadora
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// "2026-11-10" → "Martes 10/11"
export function diaConNombre(fecha: string) {
  const nombre = new Date(`${fecha}T00:00`).toLocaleDateString('es-AR', { weekday: 'long' });
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${formatearFecha(fecha).slice(0, 5)}`;
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
