import cors from 'cors';
import express, { type Router } from 'express';
import { leerEnv } from './config/env';
import { errorHandler, rutaNoEncontrada } from './errors/errorHandler';

/**
 * PUNTO ÚNICO DE REGISTRO DE MÓDULOS.
 * Para agregar una feature: crear src/modules/<nombre>/ y sumar una entrada aquí.
 * Ver docs/contribucion.md.
 */
const modulos: Array<{ ruta: string; router: Router }> = [
  // { ruta: '/api/auth', router: authRouter },   // HU-01 / HU-02
];

export function crearApp() {
  const env = leerEnv();
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/salud', (_req, res) => {
    res.json({ estado: 'ok' });
  });

  for (const { ruta, router } of modulos) {
    app.use(ruta, router);
  }

  app.use(rutaNoEncontrada);
  app.use(errorHandler);

  return app;
}
