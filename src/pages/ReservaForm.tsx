import { useState, type ChangeEvent, type SubmitEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import { useFetch } from '../useFetch';
import { fechaParaInput } from '../formato';
import type { Huesped, Inmueble, Reserva } from '../types';

interface Props {
  reserva: Reserva | null; // null = alta; si viene una reserva (con sus huéspedes), es edición
  onCerrar: () => void;
  onGuardado: (reserva: Reserva) => void;
}

// Un error por campo, con el mismo nombre que el campo
type Errores = Record<string, string>;

// Mismo patrón que UsuarioForm: se monta al abrirse, valida en el front y muestra en un Alert lo que solo sabe la API
export function ReservaForm({ reserva, onCerrar, onGuardado }: Props) {
  const esEdicion = reserva !== null;
  const inmuebles = useFetch<Inmueble[]>('/inmuebles');
  const huespedes = useFetch<Huesped[]>('/huespedes');

  // Todo como texto, que es lo que manejan los inputs; se convierte al mandar
  const [campos, setCampos] = useState({
    staysId: reserva?.staysId ?? '',
    titular: reserva?.titular ?? '',
    inmuebleId: reserva ? String(reserva.inmuebleId) : '',
    fechaInicio: fechaParaInput(reserva?.fechaInicio ?? null),
    horaInicio: reserva?.horaInicio ?? '15:00',
    fechaFin: fechaParaInput(reserva?.fechaFin ?? null),
    horaFin: reserva?.horaFin ?? '10:00',
    costoEstadia: reserva?.costoEstadia ?? '',
    moneda: reserva?.moneda ?? '',
    costo: reserva?.costo ?? '',
    fechaCosto: fechaParaInput(reserva?.fechaCosto ?? null),
  });
  const [huespedIds, setHuespedIds] = useState<number[]>(reserva?.huespedes?.map((h) => h.id) ?? []);
  const [errores, setErrores] = useState<Errores>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Un solo onChange para todos los inputs: el name del input dice qué campo cambia
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCampos({ ...campos, [e.target.name]: e.target.value });
  };

  const toggleHuesped = (id: number) => {
    setHuespedIds(huespedIds.includes(id) ? huespedIds.filter((h) => h !== id) : [...huespedIds, id]);
  };

  // Las mismas reglas que el schema de Zod del back
  const validar = () => {
    const e: Errores = {};
    if (!campos.staysId.trim()) e.staysId = 'Es obligatorio.';
    else if (campos.staysId.trim().length > 50) e.staysId = 'Puede tener como máximo 50 caracteres.';
    if (!campos.titular.trim()) e.titular = 'Es obligatorio.';
    else if (campos.titular.trim().length > 100) e.titular = 'Puede tener como máximo 100 caracteres.';
    if (!campos.inmuebleId) e.inmuebleId = 'Elegí un inmueble.';
    if (!campos.fechaInicio) e.fechaInicio = 'Es obligatoria.';
    if (!campos.horaInicio) e.horaInicio = 'Es obligatoria.';
    if (!campos.fechaFin) e.fechaFin = 'Es obligatoria.';
    // Las fechas AAAA-MM-DD se pueden comparar como texto
    else if (campos.fechaFin < campos.fechaInicio) e.fechaFin = 'No puede ser anterior a la entrada.';
    if (!campos.horaFin) e.horaFin = 'Es obligatoria.';
    if (campos.costoEstadia !== '' && Number(campos.costoEstadia) < 0) e.costoEstadia = 'No puede ser negativo.';
    if (campos.moneda !== '' && !/^[A-Z]{3}$/.test(campos.moneda)) e.moneda = 'Tres letras, por ejemplo ARS o USD.';
    if (campos.costo !== '' && Number(campos.costo) < 0) e.costo = 'No puede ser negativo.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setErrorApi(null);
    if (!validar()) return;

    setGuardando(true);
    // Los opcionales vacíos van como null: en la edición, eso borra el valor que tenía
    const datos = {
      staysId: campos.staysId.trim(),
      titular: campos.titular.trim(),
      inmuebleId: Number(campos.inmuebleId),
      fechaInicio: campos.fechaInicio,
      horaInicio: campos.horaInicio,
      fechaFin: campos.fechaFin,
      horaFin: campos.horaFin,
      costoEstadia: campos.costoEstadia === '' ? null : Number(campos.costoEstadia),
      moneda: campos.moneda === '' ? null : campos.moneda,
      costo: campos.costo === '' ? null : Number(campos.costo),
      fechaCosto: campos.fechaCosto === '' ? null : campos.fechaCosto,
      huespedIds,
    };
    try {
      const guardada = esEdicion
        ? await apiFetch<Reserva>(`/reservas/${reserva.id}`, { method: 'PATCH', body: JSON.stringify(datos) })
        : await apiFetch<Reserva>('/reservas', { method: 'POST', body: JSON.stringify(datos) });
      onGuardado(guardada);
    } catch (err) {
      setErrorApi((err as Error).message);
      setGuardando(false);
    }
  };


  return (
    <Modal show onHide={onCerrar} size="lg" fullscreen="sm-down" backdrop={guardando ? 'static' : true}>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton={!guardando}>
          <Modal.Title>{esEdicion ? 'Editar reserva' : 'Nueva reserva'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorApi && <Alert variant="danger">{errorApi}</Alert>}
          {(inmuebles.error || huespedes.error) && (
            <Alert variant="danger">No se pudieron cargar los inmuebles o los huéspedes: {inmuebles.error ?? huespedes.error}</Alert>
          )}

          {/* En el celular un campo por fila; desde md, de a dos */}
          <Row className="g-3">
            <Col xs={12} md={6}>
              <Form.Group controlId="reserva-titular">
                <Form.Label>Titular</Form.Label>
                <Form.Control name="titular" value={campos.titular} onChange={handleChange} isInvalid={!!errores.titular} autoFocus />
                <Form.Control.Feedback type="invalid">{errores.titular}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group controlId="reserva-stays">
                <Form.Label>Id en Stays</Form.Label>
                <Form.Control name="staysId" value={campos.staysId} onChange={handleChange} isInvalid={!!errores.staysId} />
                <Form.Control.Feedback type="invalid">{errores.staysId}</Form.Control.Feedback>
                <Form.Text>El código de la reserva en Stays. No se puede repetir.</Form.Text>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="reserva-inmueble">
                <Form.Label>Inmueble</Form.Label>
                <Form.Select name="inmuebleId" value={campos.inmuebleId} onChange={handleChange} isInvalid={!!errores.inmuebleId} disabled={!inmuebles.data}>
                  <option value="">{inmuebles.data ? 'Elegí uno...' : 'Cargando...'}</option>
                  {inmuebles.data?.map((i) => (
                    <option key={i.id} value={i.id}>{i.direccion}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errores.inmuebleId}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Fecha y hora, juntas en la misma fila desde sm */}
            <Col xs={7} md={4}>
              <Form.Group controlId="reserva-fecha-inicio">
                <Form.Label>Entrada</Form.Label>
                <Form.Control type="date" name="fechaInicio" value={campos.fechaInicio} onChange={handleChange} isInvalid={!!errores.fechaInicio} />
                <Form.Control.Feedback type="invalid">{errores.fechaInicio}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={5} md={2}>
              <Form.Group controlId="reserva-hora-inicio">
                <Form.Label>Hora</Form.Label>
                <Form.Control type="time" name="horaInicio" value={campos.horaInicio} onChange={handleChange} isInvalid={!!errores.horaInicio} />
                <Form.Control.Feedback type="invalid">{errores.horaInicio}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={7} md={4}>
              <Form.Group controlId="reserva-fecha-fin">
                <Form.Label>Salida</Form.Label>
                <Form.Control type="date" name="fechaFin" value={campos.fechaFin} onChange={handleChange} isInvalid={!!errores.fechaFin} />
                <Form.Control.Feedback type="invalid">{errores.fechaFin}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={5} md={2}>
              <Form.Group controlId="reserva-hora-fin">
                <Form.Label>Hora</Form.Label>
                <Form.Control type="time" name="horaFin" value={campos.horaFin} onChange={handleChange} isInvalid={!!errores.horaFin} />
                <Form.Control.Feedback type="invalid">{errores.horaFin}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={7} md={4}>
              <Form.Group controlId="reserva-costo-estadia">
                <Form.Label>Costo estadía</Form.Label>
                <Form.Control type="number" min="0" step="0.01" name="costoEstadia" value={campos.costoEstadia} onChange={handleChange} isInvalid={!!errores.costoEstadia} />
                <Form.Control.Feedback type="invalid">{errores.costoEstadia}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={5} md={2}>
              <Form.Group controlId="reserva-moneda">
                <Form.Label>Moneda</Form.Label>
                <Form.Control
                  value={campos.moneda}
                  // La API pide el código en mayúsculas: se convierte mientras se escribe
                  onChange={(e) => setCampos({ ...campos, moneda: e.target.value.toUpperCase() })}
                  isInvalid={!!errores.moneda}
                  maxLength={3}
                  placeholder="ARS"
                />
                <Form.Control.Feedback type="invalid">{errores.moneda}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={7} md={4}>
              <Form.Group controlId="reserva-costo">
                <Form.Label>Costo operativo ($)</Form.Label>
                <Form.Control type="number" min="0" step="0.01" name="costo" value={campos.costo} onChange={handleChange} isInvalid={!!errores.costo} />
                <Form.Control.Feedback type="invalid">{errores.costo}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={5} md={2}>
              <Form.Group controlId="reserva-fecha-costo">
                <Form.Label>Fecha</Form.Label>
                <Form.Control type="date" name="fechaCosto" value={campos.fechaCosto} onChange={handleChange} isInvalid={!!errores.fechaCosto} />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Label>Huéspedes ({huespedIds.length} elegidos)</Form.Label>
              {/* Lista con scroll para que el formulario no se haga eterno */}
              <div className="border rounded p-2 overflow-auto" style={{ maxHeight: 200 }}>
                {!huespedes.data && <Spinner size="sm" />}
                {huespedes.data?.map((h) => (
                  <Form.Check
                    key={h.id}
                    id={`huesped-${h.id}`}
                    label={`${h.apellido}, ${h.nombres}${h.dni ? ` (${h.dni})` : ''}`}
                    checked={huespedIds.includes(h.id)}
                    onChange={() => toggleHuesped(h.id)}
                  />
                ))}
              </div>
            </Col>
          </Row>
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
