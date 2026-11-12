import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import { useFetch } from '../useFetch';
import { formatearFecha } from '../formato';
import type { Notificacion } from '../types';

// Los avisos de "te asignaron un check-in / check-out". Llegan solo a quien tiene el movimiento asignado.
export function Notificaciones() {
  const navigate = useNavigate();
  // Lo que el Layout le pasa por <Outlet context>: para que el contador del Navbar se entere al marcar todas
  const { contarNoLeidas } = useOutletContext<{ contarNoLeidas: () => void }>();
  const { data: notificaciones, loading, error, cargar, setData } = useFetch<Notificacion[]>('/notificaciones/mias');
  const [marcando, setMarcando] = useState(false);
  const [errorMarcar, setErrorMarcar] = useState<string | null>(null);

  const noLeidas = notificaciones?.filter((n) => !n.leida) ?? [];

  // Tocar una la marca leída y lleva a la agenda, donde está el movimiento
  const handleAbrir = async (n: Notificacion) => {
    if (!n.leida) {
      try {
        await apiFetch(`/notificaciones/${n.id}/leida`, { method: 'PATCH' });
      } catch (err) {
        setErrorMarcar((err as Error).message);
        return; // nos quedamos acá para que se vea el error
      }
    }
    navigate('/agenda');
  };

  // La API marca de a una: se manda un pedido por cada no leída, todos a la vez (Promise.all)
  const handleMarcarTodas = async () => {
    setMarcando(true);
    setErrorMarcar(null);
    try {
      await Promise.all(noLeidas.map((n) => apiFetch(`/notificaciones/${n.id}/leida`, { method: 'PATCH' })));
      setData(notificaciones!.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      setErrorMarcar((err as Error).message);
      cargar(); // si alguna falló, se vuelve a pedir la lista para ver cuáles quedaron
    } finally {
      setMarcando(false);
      contarNoLeidas();
    }
  };

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <h1 className="h3 mb-0">Notificaciones</h1>
        <Button variant="outline-primary" onClick={handleMarcarTodas} disabled={marcando || noLeidas.length === 0}>
          {marcando ? <><Spinner size="sm" className="me-2" />Marcando...</> : 'Marcar todas como leídas'}
        </Button>
      </div>

      {errorMarcar && <Alert variant="danger" dismissible onClose={() => setErrorMarcar(null)}>{errorMarcar}</Alert>}
      {error && (
        <Alert variant="danger">
          {error} <Button variant="outline-danger" size="sm" onClick={cargar}>Reintentar</Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando notificaciones...</p></div>
      ) : notificaciones && notificaciones.length === 0 ? (
        <Alert variant="secondary">No tenés notificaciones. Te llega una cada vez que te asignan un check-in o un check-out.</Alert>
      ) : notificaciones && (
        <ListGroup>
          {notificaciones.map((n) => (
            // Las no leídas van resaltadas y en negrita
            <ListGroup.Item
              key={n.id}
              action
              onClick={() => handleAbrir(n)}
              variant={n.leida ? undefined : 'primary'}
              className="d-flex gap-2 align-items-start"
            >
              <div className="flex-grow-1">
                <div className={n.leida ? '' : 'fw-semibold'}>{n.mensaje}</div>
                <div className="small text-body-secondary">{formatearFecha(n.fecha)} {n.hora}</div>
              </div>
              {!n.leida && <Badge bg="primary">Nueva</Badge>}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </>
  );
}
