import { useAuth } from '../AuthContext';

export function Inicio() {
  const { usuario, rol } = useAuth();
  return (
    <>
      <h1 className="h3">Hola, {usuario?.nombre}</h1>
      <p className="text-body-secondary">Entraste como {rol}. Elegí una opción del menú para empezar.</p>
    </>
  );
}
