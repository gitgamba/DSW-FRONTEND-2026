import { useState, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { apiFetch } from '../api';
import type { Rol, TipoUsuario } from '../types';

interface Props {
  registro: TipoUsuario | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export function TipoUsuarioForm({ registro, onCerrar, onGuardado }: Props) {
  const [descripcion, setDescripcion] = useState(registro?.descripcion ?? '');
  const [rolBase, setRolBase] = useState<Rol | ''>(registro?.rolBase ?? '');
  const [errores, setErrores] = useState<{ descripcion?: string; rolBase?: string }>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (evento: SubmitEvent) => {
    evento.preventDefault();
    setErrorApi(null);
    const nuevos: typeof errores = {};
    if (!descripcion.trim() || descripcion.trim().length > 50) nuevos.descripcion = 'Escribí entre 1 y 50 caracteres.';
    if (!rolBase) nuevos.rolBase = 'Elegí un rol base.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    setGuardando(true);
    try {
      await apiFetch('/tipos-usuario' + (registro ? '/' + registro.id : ''), {
        method: registro ? 'PUT' : 'POST', body: JSON.stringify({ descripcion: descripcion.trim(), rolBase }),
      });
      onGuardado();
    } catch (err) { setErrorApi((err as Error).message); }
    finally { setGuardando(false); }
  };
  return <Modal show onHide={() => !guardando && onCerrar()} fullscreen="sm-down" backdrop={guardando ? 'static' : true}>
    <Form noValidate onSubmit={guardar} className="d-flex flex-column h-100">
      <Modal.Header closeButton={!guardando}><Modal.Title>{registro ? 'Editar tipo de usuario' : 'Nuevo tipo de usuario'}</Modal.Title></Modal.Header>
      <Modal.Body>
        {errorApi && <Alert variant="danger">{errorApi}</Alert>}
        <Form.Group controlId="tipo-descripcion" className="mb-3">
          <Form.Label>Descripción</Form.Label>
          <Form.Control value={descripcion} onChange={e => setDescripcion(e.target.value)} isInvalid={!!errores.descripcion} autoFocus />
          <Form.Control.Feedback type="invalid">{errores.descripcion}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="tipo-rol">
          <Form.Label>Rol base</Form.Label>
          <Form.Select value={rolBase} onChange={e => setRolBase(e.target.value as Rol)} isInvalid={!!errores.rolBase}>
            <option value="">Elegí un rol...</option>
            <option>Administrador</option><option>Supervisor</option><option>Operador</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">{errores.rolBase}</Form.Control.Feedback>
        </Form.Group>
        {registro && <Alert variant="warning" className="mt-3 mb-0">Cambiar el rol afecta a todos los usuarios de este tipo al volver a iniciar sesión. No se puede dejar al sistema sin administradores.</Alert>}
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button></Modal.Footer>
    </Form>
  </Modal>;
}
