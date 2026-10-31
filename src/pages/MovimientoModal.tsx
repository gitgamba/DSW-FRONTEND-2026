import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';
import { useFetch } from '../useFetch';
import { formatearFecha } from '../formato';
import type { FilaAgenda, MovimientoDetalle } from '../types';

interface Props { fila: FilaAgenda; onCerrar: () => void; onRealizado: (fila: FilaAgenda) => void }

export function MovimientoModal({ fila, onCerrar, onRealizado }: Props) {
  const { rol } = useAuth();
  const { data: movimiento, loading, error, cargar } = useFetch<MovimientoDetalle>('/movimientos/' + fila.id);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const handleRealizado = async () => {
    if (!movimiento) return;
    setGuardando(true); setErrorGuardar(null);
    try {
      const actualizado = await apiFetch<MovimientoDetalle>('/movimientos/' + movimiento.id + '/realizado', { method: 'PATCH', body: '{}' });
      const esEntrada = actualizado.tipo === 'CHECK_IN';
      onRealizado({
        ...fila, estado: actualizado.estado, descripcion: actualizado.descripcion, usuario: actualizado.usuario,
        fecha: (esEntrada ? actualizado.reserva.fechaInicio : actualizado.reserva.fechaFin).slice(0, 10),
        hora: esEntrada ? actualizado.reserva.horaInicio : actualizado.reserva.horaFin,
        inmueble: actualizado.reserva.inmueble, titular: actualizado.reserva.titular,
      });
    } catch (err) { setErrorGuardar((err as Error).message); }
    finally { setGuardando(false); }
  };
  const entrada = movimiento?.tipo === 'CHECK_IN';
  return <Modal show onHide={() => !guardando && onCerrar()} centered fullscreen="sm-down" backdrop={guardando ? 'static' : true}>
    <Modal.Header closeButton={!guardando}><Modal.Title as="h2" className="h5 mb-0">Detalle del movimiento</Modal.Title></Modal.Header>
    <Modal.Body>
      {loading ? <div className="text-center"><Spinner /><p>Cargando detalle...</p></div> : error ?
        <Alert variant="danger">{error} <Button variant="outline-danger" onClick={cargar}>Reintentar</Button></Alert> : movimiento && <>
        {errorGuardar && <Alert variant="danger">{errorGuardar}</Alert>}
        <h2 className="h5">{entrada ? 'Check-in' : 'Check-out'}</h2>
        <p>Fecha: {formatearFecha(entrada ? movimiento.reserva.fechaInicio : movimiento.reserva.fechaFin)} · {entrada ? movimiento.reserva.horaInicio : movimiento.reserva.horaFin}</p>
        <p className="fw-semibold text-break">{movimiento.reserva.inmueble.direccion}</p>
        <p>Titular: {rol === 'Operador' ? movimiento.reserva.titular : <Link to={'/reservas/' + movimiento.reservaId}>{movimiento.reserva.titular}</Link>}</p>
        <p>Operador: {movimiento.usuario?.nombre ?? 'Sin asignar'}</p>
        <p>Estado: <Badge bg={movimiento.estado === 'REALIZADO' ? 'success' : movimiento.estado === 'CANCELADO' ? 'secondary' : 'warning'}>{movimiento.estado}</Badge></p>
        {movimiento.descripcion && <Alert variant="info">Nota: {movimiento.descripcion}</Alert>}
        {movimiento.fechaRealizado && <p>Realizado: {formatearFecha(movimiento.fechaRealizado)} {movimiento.horaRealizado}</p>}
      </>}
    </Modal.Body>
    <Modal.Footer><Button variant="secondary" disabled={guardando} onClick={onCerrar}>Cerrar</Button>
      {!loading && !error && movimiento?.estado === 'PENDIENTE' && <Button variant="success" disabled={guardando} onClick={handleRealizado}>{guardando ? 'Guardando...' : 'Marcar como hecho'}</Button>}
    </Modal.Footer>
  </Modal>;
}
