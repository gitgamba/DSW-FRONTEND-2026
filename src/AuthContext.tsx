import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
import type { Rol, Usuario } from './types';

interface AuthValor {
  usuario: Usuario | null;
  rol: Rol | null;
  token: string | null;
  login: (nombre: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);

// El token va en localStorage para que la sesión sobreviva al F5 (decisión del equipo).
// Si ya venció, la primera llamada a la API responde 401 y apiFetch nos manda al login.
function leerSesion() {
  try {
    const token = localStorage.getItem('token');
    const guardado = localStorage.getItem('usuario');
    const usuario = guardado ? JSON.parse(guardado) : null;
    if (token && usuario && Number.isInteger(usuario.id) && typeof usuario.nombre === 'string'
        && ['Administrador', 'Supervisor', 'Operador'].includes(usuario.tipoUsuario?.rolBase)) {
      return { token, usuario: usuario as Usuario };
    }
  } catch {
    // Un dato corrupto o una sesión anterior al cambio de roles se descarta.
  }
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  return { token: null, usuario: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<{ token: string | null; usuario: Usuario | null }>(leerSesion());

  const login = async (nombre: string, password: string) => {
    const datos = await apiFetch<{ token: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombre, password }),
    });
    localStorage.setItem('token', datos.token);
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));
    setSesion(datos);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setSesion({ token: null, usuario: null });
  };

  // El permiso viene del rol base, no del nombre del puesto
  const rol = (sesion.usuario?.tipoUsuario.rolBase ?? null) as Rol | null;

  return (
    <AuthContext.Provider value={{ ...sesion, rol, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}
