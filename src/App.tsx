import { Routes, Route } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import { Layout } from './components/Layout';
import { RutaProtegida } from './components/RutaProtegida';
import { Login } from './pages/Login';
import { Inicio } from './pages/Inicio';
import { TiposUsuario } from './pages/TiposUsuario';
import { Inmuebles } from './pages/Inmuebles';
import { Huespedes } from './pages/Huespedes';
import { Usuarios } from './pages/Usuarios';
import { Reservas } from './pages/Reservas';
import { ReservaDetalle } from './pages/ReservaDetalle';
import { Movimientos } from './pages/Movimientos';
import { Agenda } from './pages/Agenda';
import { Notificaciones } from './pages/Notificaciones';

// Los roles de cada ruta tienen que coincidir con los del menú (components/Layout.tsx)
// y con los permisos de la API.
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Todo lo de adentro necesita sesión y se muestra con el Navbar */}
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Inicio />} />
        <Route path="tipos-usuario" element={<RutaProtegida roles={['Administrador']}><TiposUsuario /></RutaProtegida>} />
        <Route path="inmuebles" element={<RutaProtegida roles={['Administrador']}><Inmuebles /></RutaProtegida>} />
        <Route path="huespedes" element={<RutaProtegida roles={['Administrador']}><Huespedes /></RutaProtegida>} />
        <Route path="usuarios" element={<RutaProtegida roles={['Administrador']}><Usuarios /></RutaProtegida>} />
        <Route path="reservas" element={<RutaProtegida roles={['Administrador', 'Supervisor']}><Reservas /></RutaProtegida>} />
        <Route path="reservas/:id" element={<RutaProtegida roles={['Administrador', 'Supervisor']}><ReservaDetalle /></RutaProtegida>} />
        <Route path="movimientos" element={<RutaProtegida roles={['Administrador', 'Supervisor']}><Movimientos /></RutaProtegida>} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="*" element={<Alert variant="secondary">Esta página no existe.</Alert>} />
      </Route>
    </Routes>
  );
}
