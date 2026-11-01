import cors from 'cors';
import express, { type Router } from 'express';
import { leerEnv } from './config/env';
import { errorHandler, rutaNoEncontrada } from './errors/errorHandler';
import { authRouter } from './modules/auth';
import { categoriasRouter } from './modules/categorias';
import { comentariosRouter } from './modules/comentarios';
import { publicacionesRouter } from './modules/publicaciones';
import { denunciasRouter, moderacionRouter } from './modules/reportes';
import { usuariosRouter } from './modules/usuarios';

/**
 * PUNTO ÚNICO DE REGISTRO DE MÓDULOS.
 * Para agregar una feature: crear src/modules/<nombre>/ y sumar una entrada aquí.
 * Ver docs/contribucion.md.
 */
const modulos: Array<{ ruta: string; router: Router }> = [
  { ruta: '/api/auth', router: authRouter }, // HU-01 / HU-02
  { ruta: '/api/usuarios', router: usuariosRouter }, // HU-02
  { ruta: '/api/categorias', router: categoriasRouter }, // HU-06a
  { ruta: '/api/publicaciones', router: publicacionesRouter }, // HU-03
  { ruta: '/api/publicaciones/:publicacionId/comentarios', router: comentariosRouter }, // HU-04
  { ruta: '/api/publicaciones/:publicacionId/reportes', router: denunciasRouter }, // HU-05
  { ruta: '/api/reportes', router: moderacionRouter }, // HU-06b
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
