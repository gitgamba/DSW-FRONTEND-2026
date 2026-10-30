import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { useAuth } from '../AuthContext';

export function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión, el login no tiene sentido
  if (usuario) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(nombre.trim(), password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    // Mobile-first: ocupa todo el ancho en el celular y se va achicando en sm, md y lg
    <Container className="py-5">
      <Card className="mx-auto col-12 col-sm-8 col-md-6 col-lg-4 shadow-sm">
        <Card.Body>
          <h1 className="h4 mb-4 text-center">Agenda de operadores</h1>

          {params.get('vencida') && !error && (
            <Alert variant="warning">Tu sesión venció. Volvé a iniciar sesión.</Alert>
          )}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="nombre">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={enviando}>
              {enviando ? <><Spinner size="sm" className="me-2" />Ingresando...</> : 'Ingresar'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
