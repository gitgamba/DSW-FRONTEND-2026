import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { apiFetch } from './api';
import { useAgenda } from './useAgenda';

vi.mock('./api', async (original) => ({ ...(await original<typeof import('./api')>()), apiFetch: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); });

describe('useAgenda', () => {
  it('pide la agenda solo con los filtros que tienen valor', async () => {
    vi.mocked(apiFetch).mockResolvedValue([]);
    renderHook(() => useAgenda({ desde: '2026-11-10', hasta: '', usuarioId: '3', sinAsignar: false }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/movimientos/agenda?desde=2026-11-10&usuarioId=3'));
  });

  it('con filtros null no pide nada', () => {
    renderHook(() => useAgenda(null));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('actualizarFila reemplaza solo la fila con ese id', async () => {
    vi.mocked(apiFetch).mockResolvedValue([{ id: 1, estado: 'PENDIENTE' }, { id: 2, estado: 'PENDIENTE' }]);
    const { result } = renderHook(() => useAgenda({}));
    await waitFor(() => expect(result.current.filas).toHaveLength(2));
    act(() => result.current.actualizarFila({ id: 2, estado: 'REALIZADO' } as never));
    expect(result.current.filas!.map((f) => f.estado)).toEqual(['PENDIENTE', 'REALIZADO']);
  });
});
