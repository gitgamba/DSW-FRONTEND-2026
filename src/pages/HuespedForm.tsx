import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { apiFetch } from '../api';
import type { Huesped } from '../types';

interface Props { registro: Huesped | null; onCerrar: () => void; onGuardado: () => void }

export function HuespedForm({ registro, onCerrar, onGuardado }: Props) {
  const [campos, setCampos] = useState({
    staysId: registro?.staysId ?? '',
    apellido: registro?.apellido ?? '',
    nombres: registro?.nombres ?? '',
    dni: registro?.dni ?? '',
    nacionalidad: registro?.nacionalidad ?? '',
    telefono: registro?.telefono ?? '',
    email: registro?.email ?? '',
    confirmoInicio: registro?.confirmoInicio ?? false, confirmoFin: registro?.confirmoFin ?? false,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const guardar = async (evento: SubmitEvent) => {
    evento.preventDefault(); setErrorApi(null);
    const e: Record<string, string> = {};
    if (!campos.staysId.trim() || campos.staysId.trim().length > 50) e.staysId = 'Es obligatorio. Como máximo 50 caracteres.';
    if (!campos.apellido.trim() || campos.apellido.trim().length > 100) e.apellido = 'Es obligatorio. Como máximo 100 caracteres.';
    if (!campos.nombres.trim() || campos.nombres.trim().length > 100) e.nombres = 'Es obligatorio. Como máximo 100 caracteres.';
    if (campos.dni.trim().length > 20) e.dni = 'Como máximo 20 caracteres.';
    if (campos.nacionalidad.trim().length > 50) e.nacionalidad = 'Como máximo 50 caracteres.';
    if (campos.telefono.trim().length > 30) e.telefono = 'Como máximo 30 caracteres.';
    if (campos.email.trim().length > 100) e.email = 'Como máximo 100 caracteres.';
    if (campos.email.trim() && !/^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/.test(campos.email.trim())) e.email = 'Ingresá un email válido.';
    setErrores(e);
    if (Object.keys(e).length) return;
    setGuardando(true);
    try {
      const datos = {
        staysId: campos.staysId.trim(),
        apellido: campos.apellido.trim(),
        nombres: campos.nombres.trim(),
        dni: campos.dni.trim() || null,
        nacionalidad: campos.nacionalidad.trim() || null,
        telefono: campos.telefono.trim() || null,
        email: campos.email.trim() || null,
        confirmoInicio: campos.confirmoInicio, confirmoFin: campos.confirmoFin,
      };
      await apiFetch('/huespedes' + (registro ? '/' + registro.id : ''), {
        method: registro ? 'PATCH' : 'POST', body: JSON.stringify(datos),
      });
      onGuardado();
    } catch (err) { setErrorApi((err as Error).message); }
    finally { setGuardando(false); }
  };
  return <Modal show onHide={() => !guardando && onCerrar()} fullscreen="sm-down" size="lg" backdrop={guardando ? 'static' : true}>
    <Form noValidate onSubmit={guardar} className="d-flex flex-column h-100">
      <Modal.Header closeButton={!guardando}><Modal.Title>{registro ? 'Editar huésped' : 'Nuevo huésped'}</Modal.Title></Modal.Header>
      <Modal.Body>
        {errorApi && <Alert variant="danger">{errorApi}</Alert>}
        <Form.Text>El identificador es obligatorio: usá el ID de Stays o un código propio para el alta manual.</Form.Text>
        <Row className="g-3 mt-1">
        <Col xs={12} sm={6}><Form.Group controlId="huesped-staysId">
          <Form.Label>Identificador (Stays o propio)</Form.Label>
          <Form.Control
            value={campos.staysId} onChange={e => setCampos({ ...campos, staysId: e.target.value })} isInvalid={!!errores.staysId} />
          <Form.Control.Feedback type="invalid">{errores.staysId}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="huesped-apellido">
          <Form.Label>Apellido</Form.Label>
          <Form.Control
            value={campos.apellido} onChange={e => setCampos({ ...campos, apellido: e.target.value })} isInvalid={!!errores.apellido} />
          <Form.Control.Feedback type="invalid">{errores.apellido}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="huesped-nombres">
          <Form.Label>Nombres</Form.Label>
          <Form.Control
            value={campos.nombres} onChange={e => setCampos({ ...campos, nombres: e.target.value })} isInvalid={!!errores.nombres} />
          <Form.Control.Feedback type="invalid">{errores.nombres}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="huesped-dni">
          <Form.Label>Documento</Form.Label>
          <Form.Control
            value={campos.dni} onChange={e => setCampos({ ...campos, dni: e.target.value })} isInvalid={!!errores.dni} />
          <Form.Control.Feedback type="invalid">{errores.dni}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="huesped-nacionalidad">
          <Form.Label>Nacionalidad</Form.Label>
          <Form.Control
            value={campos.nacionalidad} onChange={e => setCampos({ ...campos, nacionalidad: e.target.value })} isInvalid={!!errores.nacionalidad} />
          <Form.Control.Feedback type="invalid">{errores.nacionalidad}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="huesped-telefono">
          <Form.Label>Teléfono</Form.Label>
          <Form.Control
            value={campos.telefono} onChange={e => setCampos({ ...campos, telefono: e.target.value })} isInvalid={!!errores.telefono} />
          <Form.Control.Feedback type="invalid">{errores.telefono}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Group controlId="huesped-email">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email"
            value={campos.email} onChange={e => setCampos({ ...campos, email: e.target.value })} isInvalid={!!errores.email} />
          <Form.Control.Feedback type="invalid">{errores.email}</Form.Control.Feedback>
        </Form.Group></Col>
        <Col xs={12} sm={6}><Form.Check id="huesped-confirmo-inicio" label="Confirmó ingreso" checked={campos.confirmoInicio} onChange={e => setCampos({ ...campos, confirmoInicio: e.target.checked })} /></Col>
        <Col xs={12} sm={6}><Form.Check id="huesped-confirmo-fin" label="Confirmó salida" checked={campos.confirmoFin} onChange={e => setCampos({ ...campos, confirmoFin: e.target.checked })} /></Col>
        </Row>
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button></Modal.Footer>
    </Form>
  </Modal>;
}
