import { rutaConFiltros } from './api';
import type { FilaAgenda } from './types';
import { useFetch } from './useFetch';

interface FiltrosAgenda {
  desde?: string;
  hasta?: string;
  usuarioId?: string;
  sinAsignar?: boolean;
}

// Las filas de GET /movimientos/agenda. Lo usan la lista, el calendario y la planilla de movimientos.
// Con filtros null no pide nada (el calendario todavía no sabe qué rango mostrar).
export function useAgenda(filtros: FiltrosAgenda | null) {
  const { data: filas, loading, error, cargar, setData } = useFetch<FilaAgenda[]>(
    filtros ? rutaConFiltros('/movimientos/agenda', { ...filtros }) : null,
  );

  // Reemplaza una fila por su versión nueva (después de asignarla, marcarla hecha, etc.) sin volver a pedir todo
  const actualizarFila = (nueva: FilaAgenda) => {
    setData((filas ?? []).map((f) => (f.id === nueva.id ? nueva : f)));
  };

  return { filas, loading, error, cargar, actualizarFila };
}
