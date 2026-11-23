import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { apiFetch } from '../api';

interface Props { movimientoId: number; onCerrar: () => void; onBorrado: () => void }

export function MovimientoBorrarModal({ movimientoId, onCerrar, onBorrado }: Props) {
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const borrar = async () => {
    setBorrando(true); setError(null);
    try {
      await apiFetch('/movimientos/' + movimientoId, { method: 'DELETE' });
      onBorrado();
    } catch (err) { setError((err as Error).message); }
    finally { setBorrando(false); }
  };
  return <Modal show onHide={() => !borrando && onCerrar()} centered backdrop={borrando ? 'static' : true}>
    <Modal.Header closeButton={!borrando}><Modal.Title>Borrar movimiento</Modal.Title></Modal.Header>
    <Modal.Body>{error && <Alert variant="danger">{error}</Alert>}
      Se borrará el movimiento y también su notificación. La reserva se conserva. Esta acción no se puede deshacer.
    </Modal.Body>
    <Modal.Footer><Button variant="secondary" disabled={borrando} onClick={onCerrar}>Cancelar</Button>
      <Button variant="danger" disabled={borrando} onClick={borrar}>{borrando ? 'Borrando...' : 'Confirmar borrado'}</Button></Modal.Footer>
  </Modal>;
}
