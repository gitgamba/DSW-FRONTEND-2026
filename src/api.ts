// Todas las llamadas a la API pasan por acá: así el token y los errores se manejan en un solo lugar.

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('Falta VITE_API_URL en el .env (copiá .env.example)');
}

// Uso: apiFetch<Usuario[]>('/usuarios') o apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(datos) })
//Sin opciones, hace GET. Con body, hace POST. Con method, hace PUT o DELETE. Devuelve la respuesta parseada como JSON.
export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }; 
  //objeto id/valor string para pasarle a fetch. Content-Type es para que la API sepa que el body es JSON.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(API_URL + ruta, { ...opciones, headers });
  } catch {
    // fetch solo falla así cuando no llega al servidor (sin red, back apagado, CORS)
    throw new Error('No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo.');
  }

  // Con token y 401: venció o es inválido. Se borra la sesión y se recarga en el login.
  // (Sin token, el 401 es el del login con credenciales incorrectas y se muestra como cualquier error.)
  if (respuesta.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.assign('/login?vencida=1');
    throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
  }

  // 204 (por ejemplo al borrar) no trae body
  if (respuesta.status === 204) {
    return undefined as T;
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(mensajeDeError(respuesta.status, datos));
  }
  return datos as T;
}

// La API responde los errores como { error, detalle? }; detalle es la lista de campos inválidos
function mensajeDeError(status: number, datos: any): string {
  if (status >= 500) {
    return 'El servidor tuvo un problema. Probá de nuevo en unos minutos.';
  }
  if (!datos?.error) {
    return `Error inesperado (${status})`;
  }
  if (Array.isArray(datos.detalle)) {
    const campos = datos.detalle.map((d: { campo: string; mensaje: string }) => `${d.campo}: ${d.mensaje}`);
    return `${datos.error}. ${campos.join('; ')}`;
  }
  return datos.error;
}
