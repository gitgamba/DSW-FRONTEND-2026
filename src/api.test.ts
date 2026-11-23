import { describe, expect, it } from 'vitest';
import { rutaConFiltros } from './api';

describe('rutaConFiltros', () => {
  it('agrega solo los filtros con valor', () => {
    expect(rutaConFiltros('/reservas', { desde: '2026-11-10', hasta: '', inmuebleId: undefined, usuarioId: '3' }))
      .toBe('/reservas?desde=2026-11-10&usuarioId=3');
  });

  it('sin filtros con valor devuelve la ruta sola, sin "?"', () => {
    expect(rutaConFiltros('/reservas', { desde: '', hasta: null })).toBe('/reservas');
  });

  it('un booleano se manda solo si es true', () => {
    expect(rutaConFiltros('/movimientos/agenda', { sinAsignar: true })).toBe('/movimientos/agenda?sinAsignar=true');
    expect(rutaConFiltros('/movimientos/agenda', { sinAsignar: false })).toBe('/movimientos/agenda');
  });

  it('codifica los caracteres especiales', () => {
    expect(rutaConFiltros('/x', { q: 'a&b=c' })).toBe('/x?q=a%26b%3Dc');
  });
});
