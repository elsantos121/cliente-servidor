import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { Response } from 'supertest';
import { cargarEnvTest } from '../../tests/setup/cargarEnvTest';

// Los escenarios BDD usan la misma base de pruebas protegida que Vitest.
cargarEnvTest();

/** Estado compartido entre los pasos de un mismo escenario. */
export class ForoWorld extends World {
  respuesta?: Response;
  /** Token JWT de la sesión iniciada en el escenario (HU-02). */
  token?: string;

  constructor(opciones: IWorldOptions) {
    super(opciones);
  }
}

setWorldConstructor(ForoWorld);
