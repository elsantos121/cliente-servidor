import { execSync } from 'node:child_process';
import path from 'node:path';
import { cargarEnvTest } from './cargarEnvTest';

/**
 * Se ejecuta una vez antes de toda la suite (globalSetup de Vitest).
 * Aplica las migraciones pendientes sobre la base de pruebas. Si PostgreSQL no está
 * disponible o las credenciales son incorrectas, la suite falla aquí con un mensaje claro.
 */
export default function setup(): void {
  cargarEnvTest();
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../..'),
    env: process.env,
    stdio: 'inherit',
  });
}
