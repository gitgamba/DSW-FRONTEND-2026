import type { Usuario } from './types';

interface Sesion {
  token: string;
  usuario: Usuario;
}

export function obtenerToken() {
  return localStorage.getItem('token');
}

export function leerSesion() {
  try {
    const token = obtenerToken();
    const guardado = localStorage.getItem('usuario');
    const usuario = guardado ? JSON.parse(guardado) : null;
    if (token && usuario && Number.isInteger(usuario.id) && typeof usuario.nombre === 'string'
        && ['Administrador', 'Supervisor', 'Operador'].includes(usuario.tipoUsuario?.rolBase)) {
      return { token, usuario: usuario as Usuario };
    }
  } catch {
    // Un dato corrupto o una sesión anterior al cambio de roles se descarta.
  }
  borrarSesion();
  return { token: null, usuario: null };
}

export function guardarSesion({ token, usuario }: Sesion) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

export function borrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}
