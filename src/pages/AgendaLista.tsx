import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { useAuth } from '../AuthContext';
import { useFetch } from '../useFetch';
import { diaConNombre, hoy, sumarDias } from '../formato';
import type { FilaAgenda } from '../types';
import { MovimientoModal } from './MovimientoModal';

const COLOR_ESTADO = { PENDIENTE: 'warning', REALIZADO: 'success', CANCELADO: 'secondary' };

// Los movimientos de hoy y los 6 días siguientes, agrupados por día
export function AgendaLista({ usuarioId }: { usuarioId: string }) {
  const { rol } = useAuth();
  const desde = hoy();
  const hasta = sumarDias(desde, 6);
  const filtroUsuario = usuarioId ? `&usuarioId=${usuarioId}` : '';
  const { data: filas, loading, error, cargar, setData } = useFetch<FilaAgenda[]>(
    `/movimientos/agenda?desde=${desde}&hasta=${hasta}${filtroUsuario}`,
  );
  const [seleccionada, setSeleccionada] = useState<FilaAgenda | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const handleRealizado = (nueva: FilaAgenda) => {
    setData(filas!.map((f) => (f.id === nueva.id ? nueva : f)));
    setSeleccionada(null);
    setAviso('¡Listo! Quedó marcado como hecho.');
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando agenda...</p></div>;
  }
  if (error) {
    return (
      <Alert variant="danger">
        {error} <Button variant="outline-danger" size="sm" onClick={cargar}>Reintentar</Button>
      </Alert>
    );
  }
  if (!filas || filas.length === 0) {
    return <Alert variant="secondary">No hay check-ins ni check-outs en los próximos 7 días.</Alert>;
  }

  // Las fechas distintas, en orden (la API ya manda las filas ordenadas por fecha y hora)
  const dias = [...new Set(filas.map((f) => f.fecha))];

  return (
    <>
      {aviso && <Alert variant="success" dismissible onClose={() => setAviso(null)}>{aviso}</Alert>}

      {dias.map((dia) => (
        <section key={dia} className="mb-4">
          <h2 className="h6 text-uppercase text-body-secondary">
            {dia === desde ? 'Hoy' : dia === sumarDias(desde, 1) ? 'Mañana' : diaConNombre(dia)}
          </h2>
          <ListGroup>
            {filas.filter((f) => f.fecha === dia).map((f) => (
              <ListGroup.Item key={f.id} action onClick={() => setSeleccionada(f)} className="d-flex gap-3 align-items-start">
                <div className="fw-semibold fs-5">{f.hora}</div>
                <div className="flex-grow-1">
                  <div>
                    <Badge bg={f.tipo === 'CHECK_IN' ? 'primary' : 'info'} className="me-1">
                      {f.tipo === 'CHECK_IN' ? 'Check-in' : 'Check-out'}
                    </Badge>
                    <Badge bg={COLOR_ESTADO[f.estado]}>{f.estado}</Badge>
                  </div>
                  <div className="fw-semibold">{f.inmueble.direccion}</div>
                  <div className="small text-body-secondary">
                    {f.titular}
                    {/* A Operador no le sirve ver su propio nombre en cada fila */}
                    {rol !== 'Operador' && ` · ${f.usuario?.nombre ?? 'Sin asignar'}`}
                  </div>
                  {f.descripcion && <div className="small fst-italic">Nota: {f.descripcion}</div>}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </section>
      ))}

      {seleccionada && (
        <MovimientoModal fila={seleccionada} onCerrar={() => setSeleccionada(null)} onRealizado={handleRealizado} />
      )}
    </>
  );
}
