import { useId, useState, type ReactNode } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';

interface Props {
  titulo: string;
  children: ReactNode;
  onCerrar: () => void;
  onConfirmar: () => Promise<void>;
  textoConfirmar?: string;
}

export function ConfirmarBorrado({ titulo, children, onCerrar, onConfirmar, textoConfirmar = 'Confirmar borrado' }: Props) {
  const tituloId = useId();
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = async () => {
    setBorrando(true);
    setError(null);
    try {
      await onConfirmar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBorrando(false);
    }
  };

  return (
    <Modal
      show
      centered
      aria-labelledby={tituloId}
      backdrop={borrando ? 'static' : true}
      keyboard={!borrando}
      onHide={() => !borrando && onCerrar()}
    >
      <Modal.Header closeButton={!borrando}>
        <Modal.Title id={tituloId}>{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={borrando} onClick={onCerrar}>Cancelar</Button>
        <Button variant="danger" disabled={borrando} onClick={confirmar}>
          {borrando ? <><Spinner size="sm" className="me-2" />Borrando...</> : textoConfirmar}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
