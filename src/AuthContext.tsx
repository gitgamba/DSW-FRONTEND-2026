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
const tokenGuardado = localStorage.getItem('token');
const usuarioGuardado = localStorage.getItem('usuario');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<{ token: string | null; usuario: Usuario | null }>({
    token: tokenGuardado,
    usuario: usuarioGuardado ? JSON.parse(usuarioGuardado) : null,
  });

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

  // El rol es la descripción del tipo de usuario, igual que en el token del back
  const rol = (sesion.usuario?.tipoUsuario.descripcion ?? null) as Rol | null;

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
