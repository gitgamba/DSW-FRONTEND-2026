import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';
import { diaConNombre } from '../formato';
import type { FilaAgenda } from '../types';

interface Props {
  fila: FilaAgenda;
  onCerrar: () => void;
  onRealizado: (fila: FilaAgenda) => void;
}

// El detalle de un movimiento de la agenda, con el botón para marcarlo como hecho.
// Lo usan la vista de lista y la de calendario.
export function MovimientoModal({ fila, onCerrar, onRealizado }: Props) {
  const { rol } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tipo = fila.tipo === 'CHECK_IN' ? 'Check-in' : 'Check-out';

  const handleRealizado = async () => {
    setGuardando(true);
    setError(null);
    try {
      // Sin body: la API guarda la fecha y hora de ahora (hora de Argentina)
      await apiFetch(`/movimientos/${fila.id}/realizado`, { method: 'PATCH', body: '{}' });
      onRealizado({ ...fila, estado: 'REALIZADO' });
    } catch (err) {
      // Por ejemplo, 403 si Limpieza intenta marcar uno ajeno o 409 si está cancelado
      setError((err as Error).message);
      setGuardando(false);
    }
  };

  return (
    <Modal show onHide={onCerrar} centered backdrop={guardando ? 'static' : true}>
      <Modal.Header closeButton={!guardando}>
        <Modal.Title className="h5">{tipo} · {fila.hora}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p className="mb-1">{diaConNombre(fila.fecha)} a las {fila.hora}</p>
        <p className="mb-1 fw-semibold">{fila.inmueble.direccion}</p>
        <p className="mb-1">
          Titular:{' '}
          {/* Limpieza no tiene permiso para ver las reservas: para ellos es solo texto */}
          {rol === 'Limpieza' ? fila.titular : <Link to={`/reservas/${fila.reservaId}`}>{fila.titular}</Link>}
        </p>
        <p className="mb-1">Operador: {fila.usuario?.nombre ?? 'Sin asignar'}</p>
        {fila.descripcion && <Alert variant="info" className="mt-3 mb-0">Nota: {fila.descripcion}</Alert>}
        <p className="mt-3 mb-0">
          Estado: <Badge bg={fila.estado === 'REALIZADO' ? 'success' : fila.estado === 'CANCELADO' ? 'secondary' : 'warning'}>{fila.estado}</Badge>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCerrar} disabled={guardando}>Cerrar</Button>
        {fila.estado === 'PENDIENTE' && (
          <Button variant="success" onClick={handleRealizado} disabled={guardando}>
            {guardando ? <><Spinner size="sm" className="me-2" />Guardando...</> : 'Marcar como hecho'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
