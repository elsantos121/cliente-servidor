import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { leerEnv } from '../../src/config/env';
import { errorHandler } from '../../src/errors/errorHandler';
import { autenticar, autorizar } from '../../src/middlewares/autenticar';

// App mínima: prueba los middlewares sin depender de ningún módulo ni de la base.
function appDePrueba() {
  const app = express();
  app.get('/privado', autenticar, (req, res) => {
    res.json({ usuario: req.usuario });
  });
  app.get('/solo-admin', autenticar, autorizar('ADMIN'), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

function firmar(contenido: object, secreto = leerEnv().JWT_SECRET, opciones: jwt.SignOptions = {}) {
  return jwt.sign(contenido, secreto, { expiresIn: '1h', ...opciones });
}

describe('middleware autenticar (HU-02)', () => {
  const app = appDePrueba();

  it('con un token válido deja pasar y expone el usuario en req.usuario', async () => {
    const token = firmar({ rol: 'ESTUDIANTE' }, undefined, { subject: '7' });

    const res = await request(app).get('/privado').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.usuario).toEqual({ id: 7, rol: 'ESTUDIANTE' });
  });

  it('sin header Authorization responde 401', async () => {
    const res = await request(app).get('/privado');

    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  it('con un esquema distinto de Bearer responde 401', async () => {
    const token = firmar({ rol: 'ESTUDIANTE' }, undefined, { subject: '7' });

    const res = await request(app).get('/privado').set('Authorization', `Basic ${token}`);

    expect(res.status).toBe(401);
  });

  it('con un token firmado con otro secreto responde 401', async () => {
    const token = firmar({ rol: 'ADMIN' }, 'otro-secreto-de-al-menos-16', { subject: '7' });

    const res = await request(app).get('/privado').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('con un token expirado responde 401', async () => {
    const token = firmar({ rol: 'ESTUDIANTE' }, undefined, { subject: '7', expiresIn: -10 });

    const res = await request(app).get('/privado').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

describe('middleware autorizar(rol) (HU-02)', () => {
  const app = appDePrueba();

  it('un ADMIN accede a una ruta de ADMIN', async () => {
    const token = firmar({ rol: 'ADMIN' }, undefined, { subject: '1' });

    const res = await request(app).get('/solo-admin').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('un ESTUDIANTE en una ruta de ADMIN recibe 403', async () => {
    const token = firmar({ rol: 'ESTUDIANTE' }, undefined, { subject: '7' });

    const res = await request(app).get('/solo-admin').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('PROHIBIDO');
  });

  it('sin token, una ruta de ADMIN responde 401 (no 403)', async () => {
    const res = await request(app).get('/solo-admin');

    expect(res.status).toBe(401);
  });
});
