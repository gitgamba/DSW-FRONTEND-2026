import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import esLocale from '@fullcalendar/react/locales/es';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import Alert from 'react-bootstrap/Alert';
import { aFechaISO, sumarDias, ZONA_ARGENTINA } from '../formato';
import { useAgenda } from '../useAgenda';
import type { FilaAgenda } from '../types';
import { MovimientoModal } from './MovimientoModal';

// Color de cada movimiento en el calendario (los de Bootstrap)
function color(f: FilaAgenda) {
  if (f.estado === 'REALIZADO') return '#198754'; // verde
  if (f.estado === 'CANCELADO') return '#6c757d'; // gris
  return f.tipo === 'CHECK_IN' ? '#0d6efd' : '#0aa2c0'; // azul / celeste
}

export function AgendaCalendario({ usuarioId }: { usuarioId: string }) {
  // El rango que muestra el calendario: lo avisa FullCalendar con datesSet cada vez que se cambia de mes o semana
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null);
  // Hasta que FullCalendar no avisa el rango no se pide nada
  const { filas, error, actualizarFila } = useAgenda(rango && { ...rango, usuarioId });
  const [seleccionada, setSeleccionada] = useState<FilaAgenda | null>(null);

  // Lo que necesita FullCalendar: id, título, inicio y color. La fila entera va en extendedProps para el modal.
  const eventos = (filas ?? []).map((f) => ({
    id: String(f.id),
    title: `${f.tipo === 'CHECK_IN' ? 'In' : 'Out'} · ${f.inmueble.direccion}`,
    start: `${f.fecha}T${f.hora}`,
    color: color(f),
    extendedProps: { fila: f },
  }));

  const handleRealizado = (nueva: FilaAgenda) => {
    actualizarFila(nueva);
    setSeleccionada(null);
  };

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, classicThemePlugin]}
        locale={esLocale}
        timeZone={ZONA_ARGENTINA}
        initialView="dayGridMonth"
        headerToolbar={{ start: 'prev,next today', center: 'title', end: 'dayGridMonth,timeGridWeek' }}
        height="auto"
        events={eventos}
        // FullCalendar excluye end y la API incluye hasta.
        datesSet={(info) => setRango({
          desde: aFechaISO(info.start, ZONA_ARGENTINA),
          hasta: sumarDias(aFechaISO(info.end, ZONA_ARGENTINA), -1),
        })}
        eventClick={(info) => setSeleccionada(info.event.extendedProps.fila as FilaAgenda)}
      />

      {seleccionada && (
        <MovimientoModal fila={seleccionada} onCerrar={() => setSeleccionada(null)} onRealizado={handleRealizado} />
      )}
    </>
  );
}
