import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import { useFetch } from '../useFetch';
import { formatearFecha, hoy } from '../formato';
import type { FilaAgenda } from '../types';
import { MovimientoBorrarModal } from './MovimientoBorrarModal';
import { NotaModal } from './NotaModal';

const COLOR_ESTADO = { PENDIENTE: 'warning', REALIZADO: 'success', CANCELADO: 'secondary' };

// Planilla para repartir los check-in y check-out: cada fila tiene su desplegable de operador
// y se guarda apenas se elige.
export function Movimientos() {
  // Los filtros se aplican apenas cambian (no hay botón Buscar)
  const [desde, setDesde] = useState(hoy());
  const [hasta, setHasta] = useState('');
  const [soloSinAsignar, setSoloSinAsignar] = useState(false);

  const query = new URLSearchParams();
  if (desde) query.set('desde', desde);
  if (hasta) query.set('hasta', hasta);
  if (soloSinAsignar) query.set('sinAsignar', 'true');
  const { data: filas, loading, error, cargar, setData } = useFetch<FilaAgenda[]>(`/movimientos/agenda?${query}`);
  // Solo los de Operador y Supervisor, que son a quienes se puede asignar
  const operadores = useFetch<{ id: number; nombre: string }[]>('/usuarios/operadores');

  const [guardandoId, setGuardandoId] = useState<number | null>(null); // la fila que se está guardando
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [borrarId, setBorrarId] = useState<number | null>(null);
  const [filaNota, setFilaNota] = useState<FilaAgenda | null>(null); // la fila con el modal de nota abierto

  // Reemplaza una fila de la lista por su versión nueva
  const actualizarFila = (nueva: FilaAgenda) => {
    setData(filas!.map((f) => (f.id === nueva.id ? nueva : f)));
  };

  const handleAsignar = async (fila: FilaAgenda, valor: string) => {
    const usuarioId = valor === '' ? null : Number(valor); // "" = sacarle el operador
    setGuardandoId(fila.id);
    setErrorGuardar(null);
    setAviso(null);
    try {
      await apiFetch(`/movimientos/${fila.id}/asignar`, { method: 'PATCH', body: JSON.stringify({ usuarioId }) });
      const usuario = operadores.data?.find((o) => o.id === usuarioId) ?? null;
      // Con el filtro activo, la fila ya no corresponde a la lista: se vuelve a pedir
      if (soloSinAsignar) cargar();
      else actualizarFila({ ...fila, usuario });
      setAviso(
        usuario
          ? `${nombreTipo(fila)} de ${fila.titular} asignado a ${usuario.nombre}. Le llega un aviso.`
          : `${nombreTipo(fila)} de ${fila.titular} quedó sin asignar.`,
      );
    } catch (err) {
      // El select sigue mostrando el operador anterior: se dibuja con los datos, que no cambiaron
      setErrorGuardar((err as Error).message);
    } finally {
      setGuardandoId(null);
    }
  };

  const handleNotaGuardada = (descripcion: string | null) => {
    actualizarFila({ ...filaNota!, descripcion });
    setFilaNota(null);
    setAviso('Se guardó la nota.');
  };

  return (
    <>
      <h1 className="h3 mb-3">Movimientos</h1>

      <Row className="g-2 align-items-end mb-3">
        <Col xs={6} md={3}>
          <Form.Group controlId="mov-desde">
            <Form.Label>Desde</Form.Label>
            <Form.Control type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </Form.Group>
        </Col>
        <Col xs={6} md={3}>
          <Form.Group controlId="mov-hasta">
            <Form.Label>Hasta</Form.Label>
            <Form.Control type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </Form.Group>
        </Col>
        <Col xs={12} md="auto" className="pb-md-2">
          <Form.Check
            id="mov-sin-asignar"
            label="Solo pendientes sin asignar"
            checked={soloSinAsignar}
            onChange={(e) => setSoloSinAsignar(e.target.checked)}
          />
        </Col>
      </Row>

      {aviso && <Alert variant="success" dismissible onClose={() => setAviso(null)}>{aviso}</Alert>}
      {errorGuardar && <Alert variant="danger" dismissible onClose={() => setErrorGuardar(null)}>{errorGuardar}</Alert>}
      {operadores.error && <Alert variant="danger">No se pudieron cargar los operadores: {operadores.error}</Alert>}
      {error && (
        <Alert variant="danger">
          {error}{' '}
          <Button variant="outline-danger" size="sm" onClick={cargar}>Reintentar</Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando movimientos...</p></div>
      ) : filas && filas.length === 0 ? (
        <Alert variant="secondary">No hay movimientos para mostrar.</Alert>
      ) : filas && (
        <ListGroup>
          {filas.map((f) => (
            <ListGroup.Item key={f.id}>
              {/* Mobile-first: en el celular todo va apilado; desde md, en columnas */}
              <Row className="g-2 align-items-center">
                <Col xs={12} md={3}>
                  <div className="fw-semibold">{formatearFecha(f.fecha)} {f.hora}</div>
                  <Badge bg={f.tipo === 'CHECK_IN' ? 'primary' : 'info'} className="me-1">{nombreTipo(f)}</Badge>
                  <Badge bg={COLOR_ESTADO[f.estado]}>{f.estado}</Badge>
                </Col>
                <Col xs={12} md={5}>
                  <div>{f.inmueble.direccion}</div>
                  <Link to={`/reservas/${f.reservaId}`} className="small">{f.titular}</Link>
                  {f.descripcion && <div className="small fst-italic text-body-secondary">Nota: {f.descripcion}</div>}
                </Col>
                <Col xs={8} md={3}>
                  <Form.Select
                    size="sm"
                    aria-label={`Operador del ${nombreTipo(f)} de ${f.titular}`}
                    value={f.usuario?.id ?? ''}
                    onChange={(e) => handleAsignar(f, e.target.value)}
                    // Un movimiento cancelado no se puede asignar (la API responde 409)
                    disabled={guardandoId === f.id || f.estado === 'CANCELADO' || !operadores.data}
                  >
                    <option value="">Sin asignar</option>
                    {operadores.data?.map((o) => (
                      <option key={o.id} value={o.id}>{o.nombre}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={4} md={1} className="text-end d-flex flex-column gap-1">
                  {guardandoId === f.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <Button variant="outline-secondary" size="sm" onClick={() => setFilaNota(f)} disabled={f.estado === 'CANCELADO'}>
                      Nota
                    </Button>
                  )}
                  <Button variant="outline-danger" size="sm" onClick={() => setBorrarId(f.id)}>Borrar</Button>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {borrarId !== null && <MovimientoBorrarModal movimientoId={borrarId} onCerrar={() => setBorrarId(null)} onBorrado={() => { setBorrarId(null); setAviso('Se borró el movimiento.'); cargar(); }} />}
      {filaNota && (
        <NotaModal
          movimientoId={filaNota.id}
          titulo={`${nombreTipo(filaNota)} de ${filaNota.titular}`}
          descripcion={filaNota.descripcion}
          onCerrar={() => setFilaNota(null)}
          onGuardado={handleNotaGuardada}
        />
      )}
    </>
  );
}

function nombreTipo(f: FilaAgenda) {
  return f.tipo === 'CHECK_IN' ? 'Check-in' : 'Check-out';
}
