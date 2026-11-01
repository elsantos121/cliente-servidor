import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { limpiarBase, prisma } from '../helpers/db';

describe('POST /api/auth/registro (HU-01)', () => {
  const app = crearApp();
  beforeEach(limpiarBase);
  afterAll(() => prisma.$disconnect());

  const datos = { nombre: 'Ana Pérez', email: 'ana@uni.edu', password: 'secreta123' };

  it('con datos válidos responde 201 con el usuario ESTUDIANTE y sin contraseña ni hash', async () => {
    const res = await request(app).post('/api/auth/registro').send(datos);

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ nombre: 'Ana Pérez', email: 'ana@uni.edu', rol: 'ESTUDIANTE' });
    expect(JSON.stringify(res.body)).not.toMatch(/password|secreta123/i);
  });

  it('con un correo ya registrado (otras mayúsculas) responde 409', async () => {
    await request(app).post('/api/auth/registro').send({ ...datos, email: 'Ana@uni.edu' });

    const res = await request(app).post('/api/auth/registro').send(datos);

    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('CONFLICTO');
    expect(await prisma.usuario.count()).toBe(1);
  });

  it('sin campos responde 400 con el detalle de cada campo', async () => {
    const res = await request(app).post('/api/auth/registro').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
    expect(Object.keys(res.body.error.detalles).sort()).toEqual(['email', 'nombre', 'password']);
  });

  it('con correo mal formado responde 400 en el campo email', async () => {
    const res = await request(app).post('/api/auth/registro').send({ ...datos, email: 'no-es-correo' });

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('email');
  });

  it('con contraseña de menos de 8 caracteres responde 400 en el campo password', async () => {
    const res = await request(app).post('/api/auth/registro').send({ ...datos, password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('password');
  });

  it('ignora un campo rol enviado por el cliente: siempre crea ESTUDIANTE', async () => {
    const res = await request(app).post('/api/auth/registro').send({ ...datos, rol: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.rol).toBe('ESTUDIANTE');
    const guardado = await prisma.usuario.findUniqueOrThrow({ where: { email: 'ana@uni.edu' } });
    expect(guardado.rol).toBe('ESTUDIANTE');
  });
});
