import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { apiFetch } from '../api';
import { useFetch } from '../useFetch';
import type { Huesped } from '../types';
import { HuespedForm } from './HuespedForm';

export function Huespedes() {
  const { data, loading, error, cargar } = useFetch<Huesped[]>('/huespedes');
  const [mostrar, setMostrar] = useState(false);
  const [editando, setEditando] = useState<Huesped | null>(null);
  const [aBorrar, setABorrar] = useState<Huesped | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const abrir = async (fila: Huesped | null) => {
    setErrorAccion(null);
    if (!fila) { setEditando(null); setMostrar(true); return; }
    setProcesando(true);
    try {
      // Se consulta el detalle actualizado antes de editarlo.
      setEditando(await apiFetch<Huesped>('/huespedes/' + fila.id));
      setMostrar(true);
    } catch (err) { setErrorAccion((err as Error).message); }
    finally { setProcesando(false); }
  };
  const guardar = () => {
    setMostrar(false); setAviso('Se guardaron los cambios.'); cargar();
  };
  const borrar = async () => {
    if (!aBorrar) return;
    setProcesando(true); setErrorAccion(null);
    try {
      await apiFetch('/huespedes/' + aBorrar.id, { method: 'DELETE' });
      setABorrar(null); setAviso('Se borró el huésped.'); cargar();
    } catch (err) { setErrorAccion((err as Error).message); }
    finally { setProcesando(false); }
  };
  return <>
    <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mb-3">
      <h1 className="h3">Huéspedes</h1>
      <Button disabled={procesando} onClick={() => abrir(null)}>Agregar huésped</Button>
    </div>

    {aviso && <Alert variant="success" dismissible onClose={() => setAviso(null)}>{aviso}</Alert>}
    {errorAccion && !aBorrar && <Alert variant="danger">{errorAccion}</Alert>}
    {error && <Alert variant="danger">{error} <Button onClick={cargar} variant="outline-danger">Reintentar</Button></Alert>}
    {loading ? <div className="text-center py-4"><Spinner /><p>Cargando...</p></div> : data?.length === 0 ?
      <Alert variant="secondary">No hay registros para mostrar.</Alert> : data && <Table responsive striped className="align-middle">
      <thead><tr><th>Apellido y nombres</th><th className="d-none d-sm-table-cell">Documento</th><th className="d-none d-md-table-cell">Contacto</th><th>Acciones</th></tr></thead>
      <tbody>{data.map(fila => <tr key={fila.id}><td>{fila.apellido}, {fila.nombres}</td><td className="d-none d-sm-table-cell">{fila.dni ?? "—"}</td><td className="d-none d-md-table-cell text-break">{fila.telefono || fila.email || "—"}</td><td className="text-nowrap">
        <Button size="sm" variant="outline-primary" disabled={procesando} className="me-2" onClick={() => abrir(fila)}>Editar</Button>
        <Button size="sm" variant="outline-danger" disabled={procesando} onClick={() => { setErrorAccion(null); setABorrar(fila); }}>Borrar</Button>
      </td></tr>)}</tbody></Table>}
    {mostrar && <HuespedForm registro={editando} onCerrar={() => setMostrar(false)} onGuardado={guardar} />}
    <Modal show={aBorrar !== null} onHide={() => !procesando && setABorrar(null)} centered backdrop={procesando ? 'static' : true}>
      <Modal.Header closeButton={!procesando}><Modal.Title>Borrar huésped</Modal.Title></Modal.Header>
      <Modal.Body>{errorAccion && <Alert variant="danger">{errorAccion}</Alert>}
        ¿Querés borrar este huésped? Confirmá que ya no necesitás conservar su información.
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" disabled={procesando} onClick={() => setABorrar(null)}>Cancelar</Button>
        <Button variant="danger" disabled={procesando} onClick={borrar}>{procesando ? 'Borrando...' : 'Confirmar borrado'}</Button></Modal.Footer>
    </Modal>
  </>;
}
