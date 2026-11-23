import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { apiFetch } from '../api';
import type { Movimiento } from '../types';

interface Props {
  reservaId: number;
  disponibles: Movimiento['tipo'][];
  onCerrar: () => void;
  onGuardado: () => void;
}

export function MovimientoAltaModal({ reservaId, disponibles, onCerrar, onGuardado }: Props) {
  const [tipo, setTipo] = useState(disponibles[0] ?? 'CHECK_IN');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const guardar = async (e: SubmitEvent) => {
    e.preventDefault(); setError(null);
    if (!disponibles.includes(tipo) || descripcion.trim().length > 500) {
      setError('Elegí un tipo disponible y una nota de hasta 500 caracteres.'); return;
    }
    setGuardando(true);
    try {
      await apiFetch('/movimientos', { method: 'POST', body: JSON.stringify({ reservaId, tipo, descripcion: descripcion.trim() || null }) });
      onGuardado();
    } catch (err) { setError((err as Error).message); }
    finally { setGuardando(false); }
  };
  return <Modal show onHide={() => !guardando && onCerrar()} fullscreen="sm-down" backdrop={guardando ? 'static' : true}>
    <Form onSubmit={guardar} className="d-flex flex-column h-100">
      <Modal.Header closeButton={!guardando}><Modal.Title>Nuevo movimiento</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>Se agregará a esta reserva, pendiente y sin operador. Solo se puede tener uno de cada tipo.</p>
        <Form.Group controlId="nuevo-mov-tipo" className="mb-3"><Form.Label>Tipo de movimiento</Form.Label>
          <Form.Select value={tipo} onChange={e => setTipo(e.target.value as Movimiento['tipo'])}>
            {disponibles.map(t => <option key={t} value={t}>{t === 'CHECK_IN' ? 'Check-in' : 'Check-out'}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="nuevo-mov-nota"><Form.Label>Nota</Form.Label>
          <Form.Control as="textarea" maxLength={500} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Crear movimiento'}</Button></Modal.Footer>
    </Form>
  </Modal>;
}
