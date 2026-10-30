import { useState, type FormEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import type { TipoUsuario, Usuario } from '../types';

interface Props {
  usuario: Usuario | null; // null = alta; si viene un usuario, es edición
  tipos: TipoUsuario[];
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}

interface Errores {
  nombre?: string;
  password?: string;
  tipoUsuarioId?: string;
}

// Se monta cada vez que se abre (ver Usuarios.tsx), así el estado arranca de cero con los datos del usuario
export function UsuarioForm({ usuario, tipos, onCerrar, onGuardado }: Props) {
  const esEdicion = usuario !== null;
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [password, setPassword] = useState(''); // nunca viene de la API
  const [tipoUsuarioId, setTipoUsuarioId] = useState(usuario ? String(usuario.tipoUsuarioId) : '');
  const [errores, setErrores] = useState<Errores>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Las mismas reglas que el schema de Zod del back: así el usuario se entera antes de mandar
  const validar = () => {
    const e: Errores = {};
    if (nombre.trim().length < 3) e.nombre = 'Tiene que tener al menos 3 caracteres.';
    else if (nombre.trim().length > 50) e.nombre = 'Puede tener como máximo 50 caracteres.';
    // En la edición la contraseña es opcional: vacía significa "no cambiarla"
    if (!esEdicion || password) {
      if (password.length < 8) e.password = 'Tiene que tener al menos 8 caracteres.';
      else if (password.length > 72) e.password = 'Puede tener como máximo 72 caracteres.';
    }
    if (!tipoUsuarioId) e.tipoUsuarioId = 'Elegí un tipo de usuario.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorApi(null);
    if (!validar()) return;

    setGuardando(true);
    try {
      const datos = {
        nombre: nombre.trim(),
        tipoUsuarioId: Number(tipoUsuarioId),
        password: password || undefined, // undefined no viaja en el JSON
      };
      if (esEdicion) {
        await apiFetch(`/usuarios/${usuario.id}`, { method: 'PATCH', body: JSON.stringify(datos) });
        onGuardado(`Se guardaron los cambios de ${datos.nombre}.`);
      } else {
        await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(datos) });
        onGuardado(`Se creó el usuario ${datos.nombre}.`);
      }
    } catch (err) {
      // Lo que solo sabe la API: nombre repetido, último administrador, etc.
      setErrorApi((err as Error).message);
      setGuardando(false);
    }
  };

  return (
    // fullscreen="sm-down": en el celular el formulario ocupa toda la pantalla
    <Modal show onHide={onCerrar} fullscreen="sm-down" backdrop={guardando ? 'static' : true}>
      {/* noValidate: validamos nosotros para mostrar mensajes en castellano y con el estilo de Bootstrap */}
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton={!guardando}>
          <Modal.Title>{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorApi && <Alert variant="danger">{errorApi}</Alert>}

          <Form.Group className="mb-3" controlId="usuario-nombre">
            <Form.Label>Nombre de usuario</Form.Label>
            <Form.Control
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              isInvalid={!!errores.nombre}
              autoComplete="off"
              autoFocus
            />
            <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="usuario-password">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isInvalid={!!errores.password}
              autoComplete="new-password"
            />
            <Form.Control.Feedback type="invalid">{errores.password}</Form.Control.Feedback>
            {esEdicion && <Form.Text>Dejala vacía para no cambiarla.</Form.Text>}
          </Form.Group>

          <Form.Group controlId="usuario-tipo">
            <Form.Label>Tipo de usuario</Form.Label>
            <Form.Select
              value={tipoUsuarioId}
              onChange={(e) => setTipoUsuarioId(e.target.value)}
              isInvalid={!!errores.tipoUsuarioId}
            >
              <option value="">Elegí uno...</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.descripcion}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errores.tipoUsuarioId}</Form.Control.Feedback>
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
