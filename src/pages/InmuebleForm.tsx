import { useState, type FormEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { apiFetch } from '../api';
import type { Inmueble } from '../types';

interface Props { registro: Inmueble | null; onCerrar: () => void; onGuardado: () => void }

export function InmuebleForm({ registro, onCerrar, onGuardado }: Props) {
  const [campos, setCampos] = useState({
    staysId: registro?.staysId ?? '',
    direccion: registro?.direccion ?? '',
    precio: registro?.precio == null ? '' : String(registro.precio),
    capacidad: registro?.capacidad == null ? '' : String(registro.capacidad),
    estado: registro?.estado ?? 'ACTIVO',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const guardar = async (evento: FormEvent) => {
    evento.preventDefault(); setErrorApi(null);
    const e: Record<string, string> = {};
    if (!campos.staysId.trim() || campos.staysId.trim().length > 50) e.staysId = 'Es obligatorio. Como máximo 50 caracteres.';
    if (!campos.direccion.trim() || campos.direccion.trim().length > 200) e.direccion = 'Es obligatorio. Como máximo 200 caracteres.';
    if (campos.precio !== '' && (!Number.isFinite(Number(campos.precio)) || Number(campos.precio) < 0)) e.precio = 'Ingresá un importe no negativo.';
    if (campos.capacidad !== '' && (!Number.isInteger(Number(campos.capacidad)) || Number(campos.capacidad) <= 0)) e.capacidad = 'Ingresá un entero positivo.';
    setErrores(e);
    if (Object.keys(e).length) return;
    setGuardando(true);
    try {
      const datos = {
        staysId: campos.staysId.trim(),
        direccion: campos.direccion.trim(),
        precio: campos.precio === '' ? null : Number(campos.precio),
        capacidad: campos.capacidad === '' ? null : Number(campos.capacidad),
        estado: campos.estado,
      };
      await apiFetch('/inmuebles' + (registro ? '/' + registro.id : ''), {
        method: registro ? 'PATCH' : 'POST', body: JSON.stringify(datos),
      });
      onGuardado();
    } catch (err) { setErrorApi((err as Error).message); }
    finally { setGuardando(false); }
  };
  return <Modal show onHide={() => !guardando && onCerrar()} fullscreen="sm-down" size="lg" backdrop={guardando ? 'static' : true}>
    <Form noValidate onSubmit={guardar} className="d-flex flex-column h-100">
      <Modal.Header closeButton={!guardando}><Modal.Title>{registro ? 'Editar inmueble' : 'Nuevo inmueble'}</Modal.Title></Modal.Header>
      <Modal.Body>
        {errorApi && <Alert variant="danger">{errorApi}</Alert>}
        <Form.Text>El identificador es obligatorio: usá el ID de Stays o un código propio para el alta manual.</Form.Text>
        <Row className="g-3 mt-1">
        <Col xs={12} sm={6}><Form.Group controlId="inmueble-staysId">
          <Form.Label>Identificador (Stays o propio)</Form.Label>
          <Form.Control
            value={campos.staysId} onChange={e => setCampos({ ...campos, staysId: e.target.value })} isInvalid={!!errores.staysId} />
          <Form.Control.Feedback type="invalid">{errores.staysId}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="inmueble-direccion">
          <Form.Label>Dirección</Form.Label>
          <Form.Control
            value={campos.direccion} onChange={e => setCampos({ ...campos, direccion: e.target.value })} isInvalid={!!errores.direccion} />
          <Form.Control.Feedback type="invalid">{errores.direccion}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="inmueble-precio">
          <Form.Label>Precio</Form.Label>
          <Form.Control type="number" min="0" step="0.01"
            value={campos.precio} onChange={e => setCampos({ ...campos, precio: e.target.value })} isInvalid={!!errores.precio} />
          <Form.Control.Feedback type="invalid">{errores.precio}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="inmueble-capacidad">
          <Form.Label>Capacidad</Form.Label>
          <Form.Control type="number" min="1" step="1"
            value={campos.capacidad} onChange={e => setCampos({ ...campos, capacidad: e.target.value })} isInvalid={!!errores.capacidad} />
          <Form.Control.Feedback type="invalid">{errores.capacidad}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="inmueble-estado"><Form.Label>Estado</Form.Label>
          <Form.Select value={campos.estado} onChange={e => setCampos({ ...campos, estado: e.target.value })}><option>ACTIVO</option><option>INACTIVO</option></Form.Select>
        </Form.Group></Col>
        </Row>
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button></Modal.Footer>
    </Form>
  </Modal>;
}
