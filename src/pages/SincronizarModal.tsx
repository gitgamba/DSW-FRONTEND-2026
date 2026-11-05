import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import { formatearFecha } from '../formato';

interface Resumen {
  desde: string;
  hasta: string;
  reservas: number;
  canceladas: number;
  ignoradas: number;
}

interface Props {
  onCerrar: () => void;
  onSincronizado: (mensaje: string) => void;
}

// Trae de Stays las reservas con llegada entre "desde" y "hasta".
// Tarda (Stays se consulta de a una reserva), así que mientras trabaja no se deja cerrar.
export function SincronizarModal({ onCerrar, onSincronizado }: Props) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    if (desde && hasta && hasta < desde) {
      setError('"Hasta" no puede ser anterior a "Desde".');
      return;
    }

    setSincronizando(true);
    // Sin fechas, la API usa de hoy a dentro de 30 días
    const query = new URLSearchParams();
    if (desde) query.set('desde', desde);
    if (hasta) query.set('hasta', hasta);
    try {
      const r = await apiFetch<Resumen>(`/reservas/sincronizar?${query}`, { method: 'POST' });
      onSincronizado(
        `Sincronización del ${formatearFecha(r.desde)} al ${formatearFecha(r.hasta)}: ` +
          `${r.reservas} reservas actualizadas, ${r.canceladas} canceladas y ${r.ignoradas} ignoradas.`,
      );
    } catch (err) {
      setError((err as Error).message);
      setSincronizando(false);
    }
  };

  return (
    <Modal show onHide={onCerrar} centered backdrop={sincronizando ? 'static' : true}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!sincronizando}>
          <Modal.Title>Sincronizar con Stays</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-body-secondary">
            Trae las reservas que llegan entre estas fechas, con sus inmuebles y huéspedes. Si las dejás vacías,
            se traen las de hoy a dentro de 30 días. Se puede repetir sin duplicar nada.
          </p>
          <Row className="g-2">
            <Col xs={12} sm={6}>
              <Form.Group controlId="sync-desde">
                <Form.Label>Desde</Form.Label>
                <Form.Control type="date" value={desde} onChange={(e) => setDesde(e.target.value)} disabled={sincronizando} />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group controlId="sync-hasta">
                <Form.Label>Hasta</Form.Label>
                <Form.Control type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} disabled={sincronizando} />
              </Form.Group>
            </Col>
          </Row>
          {sincronizando && (
            <Alert variant="info" className="mt-3 mb-0">
              <Spinner size="sm" className="me-2" />
              Trayendo reservas de Stays. Puede tardar un minuto: no cierres esta ventana.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCerrar} disabled={sincronizando}>Cancelar</Button>
          <Button type="submit" disabled={sincronizando}>{sincronizando ? 'Sincronizando...' : 'Sincronizar'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
