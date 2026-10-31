import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';
import { useFetch } from '../useFetch';
import { formatearFecha, formatearImporte } from '../formato';
import type { Movimiento, Reserva } from '../types';
import { MovimientoAltaModal } from './MovimientoAltaModal';
import { MovimientoBorrarModal } from './MovimientoBorrarModal';
import { ReservaForm } from './ReservaForm';

// Color del estado de cada movimiento
const COLOR_ESTADO = { PENDIENTE: 'warning', REALIZADO: 'success', CANCELADO: 'secondary' };

export function ReservaDetalle() {
  const { id } = useParams(); // el :id de la ruta /reservas/:id
  const { rol } = useAuth();
  const esAdmin = rol === 'Administrador';
  const puedeGestionar = esAdmin || rol === 'Supervisor';
  const [mostrarAltaMovimiento, setMostrarAltaMovimiento] = useState(false);
  const [borrarMovimientoId, setBorrarMovimientoId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { data: reserva, loading, error, cargar } = useFetch<Reserva>(`/reservas/${id}`);

  const [mostrarEdicion, setMostrarEdicion] = useState(false);
  const [mostrarBorrado, setMostrarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const handleGuardado = () => {
    setMostrarEdicion(false);
    setAviso('Se guardaron los cambios.');
    cargar();
  };

  const handleBorrar = async () => {
    setBorrando(true);
    setErrorBorrar(null);
    try {
      await apiFetch(`/reservas/${id}`, { method: 'DELETE' });
      navigate('/reservas'); // la reserva ya no existe: no hay detalle que mostrar
    } catch (err) {
      setErrorBorrar((err as Error).message);
      setBorrando(false);
    }
  };

  // navigate(-1) es el "Atrás" del navegador: vuelve al listado con los filtros que tenía
  const volver = <Button variant="link" className="px-0 mb-2" onClick={() => navigate(-1)}>← Volver</Button>;

  if (loading && !reserva) {
    return <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando reserva...</p></div>;
  }
  if (error || !reserva) {
    return <>{volver}<Alert variant="danger">{error}</Alert></>;
  }

  const disponibles = (['CHECK_IN', 'CHECK_OUT'] as const).filter(tipo => !reserva.movimientos?.some(m => m.tipo === tipo));

  return (
    <>
      {volver}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <h1 className="h3 mb-0">{reserva.titular}</h1>
        {esAdmin && (
          <div className="d-flex gap-2">
            <Button variant="outline-primary" className="flex-grow-1" onClick={() => setMostrarEdicion(true)}>Editar</Button>
            <Button variant="outline-danger" className="flex-grow-1" onClick={() => setMostrarBorrado(true)}>Borrar</Button>
          </div>
        )}
      </div>

      {aviso && <Alert variant="success" dismissible onClose={() => setAviso(null)}>{aviso}</Alert>}

      {/* En el celular las tarjetas van una abajo de la otra; desde lg, de a dos */}
      <Row className="g-3">
        <Col xs={12} lg={6}>
          <Card className="h-100">
            <Card.Header>Reserva</Card.Header>
            <Card.Body>
              <dl className="row mb-0">
                <dt className="col-5">Entrada</dt>
                <dd className="col-7">{formatearFecha(reserva.fechaInicio)} {reserva.horaInicio}</dd>
                <dt className="col-5">Salida</dt>
                <dd className="col-7">{formatearFecha(reserva.fechaFin)} {reserva.horaFin}</dd>
                <dt className="col-5">Inmueble</dt>
                <dd className="col-7">{reserva.inmueble.direccion}</dd>
                <dt className="col-5">Costo estadía</dt>
                <dd className="col-7">{formatearImporte(reserva.costoEstadia, reserva.moneda ?? 'ARS')}</dd>
                <dt className="col-5">Costo operativo</dt>
                <dd className="col-7">
                  {formatearImporte(reserva.costo)}
                  {reserva.fechaCosto && <span className="text-body-secondary"> ({formatearFecha(reserva.fechaCosto)})</span>}
                </dd>
                <dt className="col-5">Id en Stays</dt>
                <dd className="col-7 mb-0 text-break">{reserva.staysId}</dd>
              </dl>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="h-100">
            <Card.Header>Huéspedes</Card.Header>
            {reserva.huespedes?.length === 0 ? (
              <Card.Body className="text-body-secondary">No tiene huéspedes cargados.</Card.Body>
            ) : (
              <ListGroup variant="flush">
                {reserva.huespedes?.map((h) => (
                  <ListGroup.Item key={h.id}>
                    <div className="fw-semibold">{h.apellido}, {h.nombres}</div>
                    <div className="small text-body-secondary">
                      {[h.dni && `DNI ${h.dni}`, h.telefono, h.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card>
        </Col>

        <Col xs={12}>
          <Card>
            <Card.Header className="d-flex flex-wrap justify-content-between gap-2">Movimientos{puedeGestionar && disponibles.length > 0 && <Button size="sm" onClick={() => setMostrarAltaMovimiento(true)}>Agregar movimiento</Button>}</Card.Header>
            <Table responsive className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Operador</th>
                  <th className="d-none d-sm-table-cell">Realizado</th>
                  {puedeGestionar && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {reserva.movimientos?.map((m) => (
                  <tr key={m.id}>
                    <td className="text-nowrap">{m.tipo === 'CHECK_IN' ? 'Check-in' : 'Check-out'}</td>
                    <td><Badge bg={COLOR_ESTADO[m.estado]}>{m.estado}</Badge></td>
                    <td>{m.usuario?.nombre ?? <span className="text-body-secondary">Sin asignar</span>}</td>
                    <td className="d-none d-sm-table-cell">{realizado(m)}</td>
                    {puedeGestionar && <td><Button size="sm" variant="outline-danger" onClick={() => setBorrarMovimientoId(m.id)}>Borrar movimiento</Button></td>}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {mostrarAltaMovimiento && <MovimientoAltaModal reservaId={reserva.id} disponibles={disponibles} onCerrar={() => setMostrarAltaMovimiento(false)} onGuardado={() => { setMostrarAltaMovimiento(false); setAviso('Se creó el movimiento.'); cargar(); }} />}
      {borrarMovimientoId !== null && <MovimientoBorrarModal movimientoId={borrarMovimientoId} onCerrar={() => setBorrarMovimientoId(null)} onBorrado={() => { setBorrarMovimientoId(null); setAviso('Se borró el movimiento.'); cargar(); }} />}
      {mostrarEdicion && (
        <ReservaForm reserva={reserva} onCerrar={() => setMostrarEdicion(false)} onGuardado={handleGuardado} />
      )}

      <Modal show={mostrarBorrado} onHide={() => setMostrarBorrado(false)} centered backdrop={borrando ? 'static' : true}>
        <Modal.Header closeButton={!borrando}>
          <Modal.Title>Borrar reserva</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorBorrar && <Alert variant="danger">{errorBorrar}</Alert>}
          ¿Seguro que querés borrar la reserva de <strong>{reserva.titular}</strong>? También se borran su check-in,
          su check-out y los avisos a los operadores. Esto no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarBorrado(false)} disabled={borrando}>Cancelar</Button>
          <Button variant="danger" onClick={handleBorrar} disabled={borrando}>
            {borrando ? <><Spinner size="sm" className="me-2" />Borrando...</> : 'Borrar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function realizado(m: Movimiento) {
  if (!m.fechaRealizado) return '—';
  return `${formatearFecha(m.fechaRealizado)} ${m.horaRealizado ?? ''}`;
}
