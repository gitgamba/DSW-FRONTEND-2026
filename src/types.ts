// Las formas de los datos que devuelve la API (ver el README del back)

export type Rol = 'Administrador' | 'Supervisor' | 'Limpieza';

export interface TipoUsuario {
  id: number;
  descripcion: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  tipoUsuarioId: number;
  tipoUsuario: TipoUsuario;
}

// Las fechas llegan como texto ISO ("2026-11-10T00:00:00.000Z") y las horas como "HH:mm".
// Los importes (Decimal en la base) llegan como texto, por ejemplo "50000.00".

export interface Inmueble {
  id: number;
  staysId: string;
  direccion: string;
  precio: string | null;
  capacidad: number | null;
  estado: string; // ACTIVO | INACTIVO
}

export interface Huesped {
  id: number;
  staysId: string;
  apellido: string;
  nombres: string;
  dni: string | null;
  nacionalidad: string | null;
  telefono: string | null;
  email: string | null;
  confirmoInicio: boolean;
  confirmoFin: boolean;
}

export interface Movimiento {
  id: number;
  tipo: 'CHECK_IN' | 'CHECK_OUT';
  estado: 'PENDIENTE' | 'REALIZADO' | 'CANCELADO';
  descripcion: string | null;
  fechaRealizado: string | null;
  horaRealizado: string | null;
  usuarioId: number | null;
  usuario: Usuario | null; // el operador asignado
}

// Una fila de GET /movimientos/agenda: la fecha y hora salen de la reserva
// (la entrada para el check-in, la salida para el check-out)
export interface FilaAgenda {
  id: number;
  tipo: 'CHECK_IN' | 'CHECK_OUT';
  estado: 'PENDIENTE' | 'REALIZADO' | 'CANCELADO';
  fecha: string; // "2026-11-10"
  hora: string;
  titular: string;
  reservaId: number;
  inmueble: { id: number; direccion: string };
  usuario: { id: number; nombre: string } | null;
  descripcion: string | null;
}

// Se crea sola cuando a alguien le asignan un movimiento
export interface Notificacion {
  id: number;
  mensaje: string;
  fecha: string; // cuándo se asignó
  hora: string;
  leida: boolean;
  movimientoId: number;
}

export interface Reserva {
  id: number;
  staysId: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  titular: string;
  costoEstadia: string | null;
  moneda: string | null;
  costo: string | null;
  fechaCosto: string | null;
  inmuebleId: number;
  inmueble: Inmueble;
  // Solo vienen en el detalle (GET /reservas/:id)
  huespedes?: Huesped[];
  movimientos?: Movimiento[];
}
