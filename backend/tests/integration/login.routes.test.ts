import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { asegurarAdmin, registrar } from '../../src/modules/auth/auth.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();

beforeEach(async () => {
  await limpiarBase();
  await registrar({ nombre: 'Ana Pérez', email: 'ana@uni.edu', password: 'secreta123' });
});
afterAll(() => prisma.$disconnect());

function login(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

describe('POST /api/auth/login (HU-02)', () => {
  it('con credenciales válidas responde 200 con token y datos públicos', async () => {
    const res = await login('ana@uni.edu', 'secreta123');

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.usuario).toMatchObject({ nombre: 'Ana Pérez', email: 'ana@uni.edu', rol: 'ESTUDIANTE' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('el administrador creado por el seed inicia sesión con rol ADMIN', async () => {
    await asegurarAdmin({ nombre: 'Administrador', email: 'admin@uni.edu', password: 'admin12345' });

    const res = await login('admin@uni.edu', 'admin12345');

    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('ADMIN');
  });

  it('contraseña incorrecta y correo inexistente responden 401 con el mismo mensaje', async () => {
    const malaClave = await login('ana@uni.edu', 'incorrecta');
    const sinCuenta = await login('nadie@uni.edu', 'secreta123');

    expect(malaClave.status).toBe(401);
    expect(sinCuenta.status).toBe(401);
    expect(malaClave.body.error.mensaje).toBe('Correo o contraseña incorrectos');
    expect(sinCuenta.body.error).toEqual(malaClave.body.error);
  });

  it('sin correo ni contraseña responde 400 con el detalle por campo', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.detalles).sort()).toEqual(['email', 'password']);
  });
});

describe('GET /api/usuarios/me (HU-02)', () => {
  it('con un token válido responde 200 con los datos del usuario', async () => {
    const { body } = await login('ana@uni.edu', 'secreta123');

    const res = await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ email: 'ana@uni.edu', rol: 'ESTUDIANTE' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('sin token responde 401', async () => {
    const res = await request(app).get('/api/usuarios/me');

    expect(res.status).toBe(401);
  });

  it('con un token alterado responde 401', async () => {
    const { body } = await login('ana@uni.edu', 'secreta123');
    const [cabecera, contenido, firma] = body.token.split('.');
    const otroContenido = Buffer.from(JSON.stringify({ sub: '1', rol: 'ADMIN' })).toString('base64url');

    const res = await request(app)
      .get('/api/usuarios/me')
      .set('Authorization', `Bearer ${cabecera}.${otroContenido}.${firma}`);

    expect(contenido).not.toBe(otroContenido);
    expect(res.status).toBe(401);
  });

  it('si el usuario del token ya no existe responde 401', async () => {
    const { body } = await login('ana@uni.edu', 'secreta123');
    await limpiarBase();

    const res = await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(401);
  });
});
