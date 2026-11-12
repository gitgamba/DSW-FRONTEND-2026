import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // El back solo acepta este origen por CORS: si el 5173 está ocupado, que falle en vez de cambiar de puerto
  server: { port: 5173, strictPort: true },
});
