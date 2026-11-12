import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';

interface Props {
  movimientoId: number;
  titulo: string;
  descripcion: string | null;
  onCerrar: () => void;
  onGuardado: (descripcion: string | null) => void;
}

const MAXIMO = 500; // el mismo largo que acepta la API

// La nota de un movimiento, por ejemplo "dejar las llaves en portería"
export function NotaModal({ movimientoId, titulo, descripcion, onCerrar, onGuardado }: Props) {
  const [texto, setTexto] = useState(descripcion ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const nueva = texto.trim() === '' ? null : texto.trim(); // vacía = borrar la nota
    try {
      await apiFetch(`/movimientos/${movimientoId}`, { method: 'PATCH', body: JSON.stringify({ descripcion: nueva }) });
      onGuardado(nueva);
    } catch (err) {
      setError((err as Error).message);
      setGuardando(false);
    }
  };

  return (
    <Modal show onHide={onCerrar} centered fullscreen="sm-down" backdrop={guardando ? 'static' : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!guardando}>
          <Modal.Title className="h5">Nota: {titulo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group controlId="nota-texto">
            <Form.Label>Nota para el operador</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={MAXIMO} // el navegador no deja escribir más
              autoFocus
            />
            <Form.Text>{texto.length}/{MAXIMO}. Dejala vacía para borrarla.</Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? <><Spinner size="sm" className="me-2" />Guardando...</> : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
