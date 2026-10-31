import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';
import type { Notificacion, Rol } from '../types';

// Opciones del menú y quién las ve (los mismos roles que las rutas de App.tsx)
const MENU: { ruta: string; texto: string; roles: Rol[] }[] = [
  { ruta: '/agenda', texto: 'Agenda', roles: ['Administrador', 'Supervisor', 'Operador'] },
  { ruta: '/reservas', texto: 'Reservas', roles: ['Administrador', 'Supervisor'] },
  { ruta: '/movimientos', texto: 'Movimientos', roles: ['Administrador', 'Supervisor'] },
  { ruta: '/tipos-usuario', texto: 'Tipos de usuario', roles: ['Administrador'] },
  { ruta: '/inmuebles', texto: 'Inmuebles', roles: ['Administrador'] },
  { ruta: '/huespedes', texto: 'Huéspedes', roles: ['Administrador'] },
  { ruta: '/usuarios', texto: 'Usuarios', roles: ['Administrador'] },
  { ruta: '/notificaciones', texto: 'Notificaciones', roles: ['Administrador', 'Supervisor', 'Operador'] },
];

export function Layout() {
  const { usuario, rol, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [noLeidas, setNoLeidas] = useState(0);

  const contarNoLeidas = async () => {
    try {
      const lista = await apiFetch<Notificacion[]>('/notificaciones/mias?noLeidas=true');
      setNoLeidas(lista.length);
    } catch {
      // Si falla, el contador no es crítico: queda el número anterior y cada pantalla muestra sus propios errores
    }
  };

  // El contador de notificaciones sin leer se vuelve a pedir cada vez que se cambia de pantalla
  useEffect(() => {
    contarNoLeidas();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Las ocho opciones de administración se despliegan en línea desde xxl.
          collapseOnSelect cierra el menú al elegir una pantalla. */}
      <Navbar bg="dark" data-bs-theme="dark" expand="xxl" collapseOnSelect sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">Agenda</Navbar.Brand>
          {/* En celular y tablet el menú está cerrado: el aviso de no leídas va al lado de la hamburguesa */}
          {noLeidas > 0 && (
            <NavLink to="/notificaciones" className="ms-auto me-2 d-xxl-none text-decoration-none">
              <Badge bg="danger" pill>{noLeidas} sin leer</Badge>
            </NavLink>
          )}
          <Navbar.Toggle aria-controls="menu-principal" label="Abrir menú" />
          <Navbar.Collapse id="menu-principal">
            <Nav className="me-auto">
              {MENU.filter((opcion) => rol && opcion.roles.includes(rol)).map((opcion) => (
                // NavLink le pone la clase "active" a la opción de la página actual
                <Nav.Link key={opcion.ruta} as={NavLink} to={opcion.ruta} eventKey={opcion.ruta}>
                  {opcion.texto}
                  {opcion.ruta === '/notificaciones' && noLeidas > 0 && (
                    <Badge bg="danger" pill className="ms-1">
                      {noLeidas}
                      <span className="visually-hidden"> sin leer</span>
                    </Badge>
                  )}
                </Nav.Link>
              ))}
            </Nav>
            <div className="d-flex align-items-center gap-2 py-2 py-lg-0">
              <span className="text-light">{usuario?.nombre}</span>
              <Badge bg="secondary">{rol}</Badge>
              <Button variant="outline-light" size="sm" className="ms-auto ms-lg-2" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container as="main" className="py-3 py-lg-4">
        {/* context: la pantalla de Notificaciones lo usa para actualizar el contador sin cambiar de pantalla */}
        <Outlet context={{ contarNoLeidas }} />
      </Container>
    </>
  );
}
