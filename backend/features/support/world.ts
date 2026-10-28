import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { Response } from 'supertest';
import { cargarEnvTest } from '../../tests/setup/cargarEnvTest';

// Los escenarios BDD usan la misma base de pruebas protegida que Vitest.
cargarEnvTest();

/** Estado compartido entre los pasos de un mismo escenario. */
export class ForoWorld extends World {
  respuesta?: Response;

  constructor(opciones: IWorldOptions) {
    super(opciones);
  }
}

setWorldConstructor(ForoWorld);
