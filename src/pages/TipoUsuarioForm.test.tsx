import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiFetch } from '../api';
import { TipoUsuarioForm } from './TipoUsuarioForm';

vi.mock('../api', () => ({ apiFetch: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { vi.resetAllMocks(); });

describe('formulario de tipo de usuario', () => {
  it('valida los campos antes de llamar a la API', async () => {
    render(<TipoUsuarioForm registro={null} onCerrar={vi.fn()} onGuardado={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Elegí un rol base.')).toBeTruthy();
    expect(screen.getByText('Escribí entre 1 y 50 caracteres.')).toBeTruthy();
    expect(apiFetch).not.toHaveBeenCalled();
  });
  it('envía descripción y rol base por separado', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: 10 });
    const guardado = vi.fn();
    render(<TipoUsuarioForm registro={null} onCerrar={vi.fn()} onGuardado={guardado} />);
    await userEvent.type(screen.getByLabelText('Descripción'), 'Recepción');
    await userEvent.selectOptions(screen.getByLabelText('Rol base'), 'Operador');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(guardado).toHaveBeenCalledOnce());
    expect(apiFetch).toHaveBeenCalledWith('/tipos-usuario', { method: 'POST', body: JSON.stringify({ descripcion: 'Recepción', rolBase: 'Operador' }) });
  });
  it('informa un conflicto del backend y conserva el formulario', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('No se puede dejar el sistema sin administradores'));
    const guardado = vi.fn();
    render(<TipoUsuarioForm registro={{ id: 1, descripcion: 'Dirección', rolBase: 'Administrador' }} onCerrar={vi.fn()} onGuardado={guardado} />);
    await userEvent.selectOptions(screen.getByLabelText('Rol base'), 'Supervisor');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('No se puede dejar el sistema sin administradores');
    expect(guardado).not.toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith('/tipos-usuario/1', expect.objectContaining({ method: 'PUT' }));
  });
});
