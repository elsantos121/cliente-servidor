import path from 'node:path';
import dotenv from 'dotenv';
import { asegurarBaseDePruebas } from './guardBaseDePruebas';

/** Carga backend/.env.test y verifica que apunte a una base de pruebas. */
export function cargarEnvTest(): void {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });
  process.env.NODE_ENV = 'test';
  asegurarBaseDePruebas(process.env.DATABASE_URL);
}
