import { ConfirmarBorrado } from '../components/ConfirmarBorrado';

interface Props { onCerrar: () => void; onConfirmar: () => Promise<void> }

export function MovimientoBorrarModal({ onCerrar, onConfirmar }: Props) {
  return (
    <ConfirmarBorrado titulo="Borrar movimiento" onCerrar={onCerrar} onConfirmar={onConfirmar}>
      Se borrará el movimiento y también su notificación. La reserva se conserva. Esta acción no se puede deshacer.
    </ConfirmarBorrado>
  );
}
