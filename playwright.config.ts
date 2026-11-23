import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Credenciales locales del equipo: no se guardan en los tests ni en sus reportes.
const envBackend = resolve('../DSW-BACKEND-2026/.env');
if (existsSync(envBackend)) process.loadEnvFile(envBackend);
if (existsSync('.env.e2e')) process.loadEnvFile('.env.e2e');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('../.playwright-browsers');

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', browserName: 'chromium', actionTimeout: 20_000, navigationTimeout: 30_000, trace: 'off', video: 'off' },
  webServer: [
    { command: 'npm run dev', cwd: '../DSW-BACKEND-2026', url: 'http://localhost:3000/api/health', timeout: 120_000,
      env: { PORT: '3000', CORS_ORIGIN: 'http://localhost:5173' }, reuseExistingServer: false },
    { command: 'npm run dev', url: 'http://localhost:5173', timeout: 60_000,
      env: { VITE_API_URL: 'http://localhost:3000/api' }, reuseExistingServer: false },
  ],
});
