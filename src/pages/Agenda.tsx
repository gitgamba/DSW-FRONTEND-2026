import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useAuth } from '../AuthContext';
import { useFetch } from '../useFetch';
import { AgendaLista } from './AgendaLista';
import { AgendaCalendario } from './AgendaCalendario';

// La hoja de ruta de check-ins y check-outs, en lista (próximos 7 días) o en calendario.
// Operador ve solo lo suyo (lo filtra la API); Administrador y Supervisor pueden elegir un operador.
export function Agenda() {
  const { rol } = useAuth();
  const [usuarioId, setUsuarioId] = useState(''); // "" = todos

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <h1 className="h3 mb-0">{rol === 'Operador' ? 'Mi agenda' : 'Agenda'}</h1>
        {rol !== 'Operador' && <FiltroOperador value={usuarioId} onChange={setUsuarioId} />}
      </div>

      {/* mountOnEnter + unmountOnExit: cada pestaña se arma (y pide sus datos) al abrirse. Así, lo que se
          marcó como hecho en una se ve en la otra, y el calendario no pide nada si nadie lo abre. */}
      <Tabs defaultActiveKey="lista" className="mb-3" mountOnEnter unmountOnExit>
        <Tab eventKey="lista" title="Próximos 7 días">
          <AgendaLista usuarioId={usuarioId} />
        </Tab>
        <Tab eventKey="calendario" title="Calendario">
          <AgendaCalendario usuarioId={usuarioId} />
        </Tab>
      </Tabs>
    </>
  );
}

// Aparte para que el pedido de operadores no se haga si es Operador (la API le respondería 403)
function FiltroOperador({ value, onChange }: { value: string; onChange: (valor: string) => void }) {
  const operadores = useFetch<{ id: number; nombre: string }[]>('/usuarios/operadores');
  return (
    <Form.Select
      aria-label="Operador"
      className="w-auto"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Todos los operadores</option>
      {operadores.data?.map((o) => (
        <option key={o.id} value={o.id}>{o.nombre}</option>
      ))}
    </Form.Select>
  );
}
