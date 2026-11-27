import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { ConfirmarBorrado } from '../components/ConfirmarBorrado';
import { useFetch } from '../useFetch';
import type { TipoUsuario, Usuario } from '../types';
import { UsuarioForm } from './UsuarioForm';

// Pantalla modelo para los demás CRUD: listado + alta/edición en un modal + baja con confirmación.
export function Usuarios() {
  const { usuario: yo } = useAuth();
  const { data: usuarios, loading, error, cargar } = useFetch<Usuario[]>('/usuarios');
  const tipos = useFetch<TipoUsuario[]>('/tipos-usuario');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null); // null = alta
  const [aBorrar, setABorrar] = useState<Usuario | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const abrirFormulario = (usuario: Usuario | null) => {
    setUsuarioEditando(usuario);
    setMostrarFormulario(true);
  };

  const handleGuardado = (mensaje: string) => {
    setMostrarFormulario(false);
    setAviso(mensaje);
    cargar();
  };

  const handleBorrar = async (usuario: Usuario) => {
    await api.delete(`/usuarios/${usuario.id}`);
    setAviso(`Se borró el usuario ${usuario.nombre}.`);
    setABorrar(null);
    cargar();
  };

  return (
    <>
      {/* En el celular el título y el botón van uno abajo del otro; desde sm, en la misma línea */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <h1 className="h3 mb-0">Usuarios</h1>
        <Button onClick={() => abrirFormulario(null)} disabled={!tipos.data}>+ Nuevo usuario</Button>
      </div>

      {aviso && <Alert variant="success" dismissible onClose={() => setAviso(null)}>{aviso}</Alert>}
      {tipos.error && <Alert variant="danger">No se pudieron cargar los tipos de usuario: {tipos.error}</Alert>}
      {error && (
        <Alert variant="danger">
          {error}{' '}
          <Button variant="outline-danger" size="sm" onClick={cargar}>Reintentar</Button>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5"><Spinner /><p className="mt-2">Cargando usuarios...</p></div>
      ) : usuarios && (
        // responsive: si no entra en el celular, la tabla se desplaza de costado en vez de romper la página
        <Table striped hover responsive className="align-middle">
          <thead>
            <tr>
              <th className="d-none d-md-table-cell">#</th>
              <th>Nombre</th>
              <th className="d-none d-sm-table-cell">Tipo</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                {/* El id no le sirve al que usa el celular: se muestra recién desde md */}
                <td className="d-none d-md-table-cell">{u.id}</td>
                <td>
                  {u.nombre}
                  {/* En el celular no entra la columna Tipo: va debajo del nombre */}
                  <div className="small text-body-secondary d-sm-none">{u.tipoUsuario.descripcion}</div>
                </td>
                <td className="d-none d-sm-table-cell">{u.tipoUsuario.descripcion}</td>
                <td className="text-end text-nowrap">
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => abrirFormulario(u)} disabled={!tipos.data}>
                    Editar
                  </Button>
                  {/* Borrarse a uno mismo dejaría la sesión abierta con un usuario que ya no existe */}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setABorrar(u)}
                    disabled={u.id === yo?.id}
                    title={u.id === yo?.id ? 'No podés borrarte a vos mismo' : undefined}
                  >
                    Borrar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {mostrarFormulario && tipos.data && (
        <UsuarioForm
          usuario={usuarioEditando}
          tipos={tipos.data}
          onCerrar={() => setMostrarFormulario(false)}
          onGuardado={handleGuardado}
        />
      )}

      {aBorrar && (
        <ConfirmarBorrado titulo="Borrar usuario" textoConfirmar="Borrar" onCerrar={() => setABorrar(null)} onConfirmar={() => handleBorrar(aBorrar)}>
          ¿Seguro que querés borrar a <strong>{aBorrar.nombre}</strong>? Esto no se puede deshacer.
        </ConfirmarBorrado>
      )}
    </>
  );
}
