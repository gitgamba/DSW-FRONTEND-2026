import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import { useAuth } from '../AuthContext';
import type { Rol } from '../types';

// Sin sesión manda al login; con sesión pero sin el rol, avisa en vez de mostrar la pantalla.
// Es solo para la UX: quien controla de verdad los permisos es la API (responde 401/403).
export function RutaProtegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, rol } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (roles && (!rol || !roles.includes(rol))) {
    return <Alert variant="warning">No tenés permiso para ver esta pantalla.</Alert>;
  }
  return children;
}
