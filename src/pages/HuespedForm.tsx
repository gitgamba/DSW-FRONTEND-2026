import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import { z } from 'zod';
import { api } from '../api';
import type { Huesped } from '../types';

interface Props { registro: Huesped | null; onCerrar: () => void; onGuardado: () => void }

const huespedFormSchema = z.object({
  staysId: z.string().trim().min(1, 'Es obligatorio.').max(50, 'Como máximo 50 caracteres.'),
  apellido: z.string().trim().min(1, 'Es obligatorio.').max(100, 'Como máximo 100 caracteres.'),
  nombres: z.string().trim().min(1, 'Es obligatorio.').max(100, 'Como máximo 100 caracteres.'),
  dni: z.string().trim().max(20, 'Como máximo 20 caracteres.').transform((valor) => valor || null),
  nacionalidad: z.string().trim().max(50, 'Como máximo 50 caracteres.').transform((valor) => valor || null),
  telefono: z.string().trim().max(30, 'Como máximo 30 caracteres.').transform((valor) => valor || null),
  email: z.string().trim().max(100, 'Como máximo 100 caracteres.')
    .transform((valor) => valor || null)
    .pipe(z.email('Ingresá un email válido.').nullable()),
  confirmoInicio: z.boolean(),
  confirmoFin: z.boolean(),
});

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
    evento.preventDefault();
    setErrorApi(null);
    const resultado = huespedFormSchema.safeParse(campos);
    if (!resultado.success) {
      const erroresPorCampo = z.flattenError(resultado.error).fieldErrors;
      setErrores(Object.fromEntries(Object.entries(erroresPorCampo).map(([campo, mensajes]) => [campo, mensajes[0]])));
      return;
    }
    setErrores({});
    setGuardando(true);
    try {
      if (registro) {
        await api.patch('/huespedes/' + registro.id, resultado.data);
      } else {
        await api.post('/huespedes', resultado.data);
      }
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
