import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';

describe('API base', () => {
  const app = crearApp();

  it('GET /api/salud responde 200 con estado ok', async () => {
    const res = await request(app).get('/api/salud');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ estado: 'ok' });
  });

  it('una ruta inexistente responde 404 con el formato de error uniforme', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
  });

  it('un JSON mal formado responde 400', async () => {
    const res = await request(app)
      .post('/api/salud')
      .set('Content-Type', 'application/json')
      .send('{"mal":');

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('JSON_INVALIDO');
  });
});
