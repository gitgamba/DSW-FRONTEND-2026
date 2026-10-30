import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { useAuth } from '../AuthContext';
import { useFetch } from '../useFetch';
import { formatearFecha, hoy } from '../formato';
import type { Inmueble, Reserva, Usuario } from '../types';
import { ReservaForm } from './ReservaForm';
import { SincronizarModal } from './SincronizarModal';

export function Reservas() {
  const { rol } = useAuth();
  const esAdmin = rol === 'Administrador';
  const navigate = useNavigate();

  // Los filtros viven en la URL (?desde=...&hasta=...): así, al volver del detalle con "Atrás",
  // el listado sigue filtrado igual. Si la URL no trae "desde", se muestran de hoy en adelante.
  const [params, setParams] = useSearchParams();
  const desde = params.get('desde') ?? hoy();
  const hasta = params.get('hasta') ?? '';
  const inmuebleId = params.get('inmuebleId') ?? '';
  const usuarioId = params.get('usuarioId') ?? '';

  // La API ignora los filtros vacíos, pero mejor no mandarlos
  const query = new URLSearchParams();
  if (desde) query.set('desde', desde);
  if (hasta) query.set('hasta', hasta);
  if (inmuebleId) query.set('inmuebleId', inmuebleId);
  if (usuarioId) query.set('usuarioId', usuarioId);
  const { data: reservas, loading, error, cargar } = useFetch<Reserva[]>(`/reservas?${query}`);
  const inmuebles = useFetch<Inmueble[]>('/inmuebles');

  // Lo que el usuario está escribiendo en los filtros; se aplica recién con "Buscar"
  const [filtros, setFiltros] = useState({ desde, hasta, inmuebleId, usuarioId });
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mostrarSincronizar, setMostrarSincronizar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault();
    setParams(filtros); // cambia la URL → cambia la ruta de useFetch → se vuelve a pedir
  };

  const handleLimpiar = () => {
    // desde vacío (y no ausente) = sin filtro de fecha, también las pasadas
    const vacios = { desde: '', hasta: '', inmuebleId: '', usuarioId: '' };
    setFiltros(vacios);
    setParams(vacios);
  };

  const handleSincronizado = (mensaje: string) => {
    setMostrarSincronizar(false);
    setAviso(mensaje);
    cargar();
  };

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <h1 className="h3 mb-0">Reservas</h1>
        {esAdmin && (
          <div className="d-flex flex-column flex-sm-row gap-2">
            <Button variant="outline-primary" onClick={() => setMostrarSincronizar(true)}>Sincronizar con Stays</Button>
            <Button onClick={() => setMostrarAlta(true)}>+ Nueva reserva</Button>
          </div>
        )}
      </div>

      {/* Mobile-first: en el celular las fechas van de a dos y el resto uno por fila; desde sm, de a dos; desde lg, todos en una fila */}
      <Form onSubmit={handleBuscar} className="mb-3">
        <Row className="g-2 align-items-end">
          <Col xs={6} lg>
            <Form.Group controlId="filtro-desde">
              <Form.Label>Desde</Form.Label>
              <Form.Control type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
            </Form.Group>
          </Col>
          <Col xs={6} lg>
            <Form.Group controlId="filtro-hasta">
              <Form.Label>Hasta</Form.Label>
              <Form.Control type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} lg>
            <Form.Group controlId="filtro-inmueble">
              <Form.Label>Inmueble</Form.Label>
              <Form.Select value={filtros.inmuebleId} onChange={(e) => setFiltros({ ...filtros, inmuebleId: e.target.value })}>
                <option value="">Todos</option>
                {inmuebles.data?.map((i) => (
                  <option key={i.id} value={i.id}>{i.direccion}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          {/* GET /usuarios es solo para el Administrador: el Supervisor no tiene este filtro */}
          {esAdmin && (
            <Col xs={12} sm={6} lg>
              <FiltroUsuario value={filtros.usuarioId} onChange={(valor) => setFiltros({ ...filtros, usuarioId: valor })} />
            </Col>
          )}
          <Col xs={12} lg="auto" className="d-flex gap-2">
            <Button type="submit" className="flex-grow-1">Buscar</Button>
            <Button variant="outline-secondary" onClick={handleLimpiar}>Limpiar</Button>
          </Col>
        </Row>
      </Form>

      {aviso && <Alert variant="success" dismissible onClose={() => setAviso(null)}>{aviso}</Alert>}
      {error && (
        <Alert variant="danger">
          {error}{' '}
          <Button variant="outline-danger" size="sm" onClick={cargar}>Reintentar</Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando reservas...</p></div>
      ) : reservas && reservas.length === 0 ? (
        <Alert variant="secondary">No hay reservas con esos filtros.</Alert>
      ) : reservas && (
        <>
          <p className="text-body-secondary small mb-2">{reservas.length} reservas</p>
          <Table striped hover responsive className="align-middle">
            <thead>
              <tr>
                <th>Fechas</th>
                <th>Titular</th>
                <th className="d-none d-md-table-cell">Inmueble</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                // Toda la fila lleva al detalle; el link del titular es para teclado y lectores de pantalla
                <tr key={r.id} onClick={() => navigate(`/reservas/${r.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="text-nowrap">
                    {formatearFecha(r.fechaInicio)} {r.horaInicio}
                    <div className="small text-body-secondary">→ {formatearFecha(r.fechaFin)} {r.horaFin}</div>
                  </td>
                  <td>
                    <Link to={`/reservas/${r.id}`}>{r.titular}</Link>
                    {/* En el celular no entra la columna Inmueble: va debajo del titular */}
                    <div className="small text-body-secondary d-md-none">{r.inmueble.direccion}</div>
                  </td>
                  <td className="d-none d-md-table-cell">{r.inmueble.direccion}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {mostrarAlta && (
        <ReservaForm
          reserva={null}
          onCerrar={() => setMostrarAlta(false)}
          // Recién creada, se va a su detalle para ver los movimientos que generó
          onGuardado={(nueva) => navigate(`/reservas/${nueva.id}`)}
        />
      )}
      {mostrarSincronizar && (
        <SincronizarModal onCerrar={() => setMostrarSincronizar(false)} onSincronizado={handleSincronizado} />
      )}
    </>
  );
}

// Componente aparte para que el pedido de usuarios solo se haga si es Administrador
// (los hooks no se pueden llamar dentro de un if)
function FiltroUsuario({ value, onChange }: { value: string; onChange: (valor: string) => void }) {
  const usuarios = useFetch<Usuario[]>('/usuarios');
  return (
    <Form.Group controlId="filtro-usuario">
      <Form.Label>Operador asignado</Form.Label>
      <Form.Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {usuarios.data?.map((u) => (
          <option key={u.id} value={u.id}>{u.nombre}</option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}
