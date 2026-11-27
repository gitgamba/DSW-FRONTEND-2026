import { createContext, useContext, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
import { borrarSesion, guardarSesion, leerSesion } from './sesion';
import type { Rol, Usuario } from './types';

interface AuthValor {
  usuario: Usuario | null;
  rol: Rol | null;
  token: string | null;
  login: (nombre: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);  //Inicializo contexto

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState(leerSesion);

  const login = async (nombre: string, password: string) => {
    const datos = await apiFetch<{ token: string; usuario: Usuario }>('/auth/login', { //apiFetch es wrapper de fetch que maneja token y errores
      method: 'POST', //Post por envio de credenciales
      body: JSON.stringify({ nombre, password }), //Se pasa a texto para ser usado por HTTP
    });
    guardarSesion(datos);
    setSesion(datos); //Actualiza estado y dispara re-render de todos los componentes que usan useAuth()
  };


  //Al borrar estado , RutaProtegida detecta esto y redirige al login
  const logout = () => {
    borrarSesion();
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

export function useAuth() { //custom hook para no escribir useContext(AuthContext) en cada archivo.
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}
