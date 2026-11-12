import { useEffect, useState } from 'react';
import { apiFetch } from './api';

// El useFetch del curso, pero usando apiFetch (token y errores amigables)
// y devolviendo cargar() para volver a pedir los datos después de un alta, edición o baja.
// Con ruta null no pide nada (por ejemplo, mientras todavía no se sabe qué rango pedir).
export function useFetch<T>(ruta: string | null) {  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    if (ruta === null) return;  //sin ruta no hace nada
    setLoading(true); //Spinner
    setError(null); //Reinicio de error, si hubo uno previo.
    try {
      setData(await apiFetch<T>(ruta)); //pide y guarda
    } catch (err) {
      setData(null); // Un error al recargar no debe dejar datos anteriores visibles.
      setError((err as Error).message);
    } finally {
      setLoading(false); //termine bien o mal, deja de cargar
    }
  };

  // La primera carga, al mostrarse el componente (y cada vez que cambia la ruta)
  useEffect(() => {
    cargar();
  }, [ruta]);

  // setData: para cambiar una fila después de guardarla, sin volver a pedir (y redibujar) toda la lista
  //cargar para refrescar luego de crear fila nueva
  return { data, loading, error, cargar, setData };
}
