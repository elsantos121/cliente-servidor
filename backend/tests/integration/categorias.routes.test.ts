import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { asegurarAdmin, iniciarSesion, registrar } from '../../src/modules/auth/auth.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();
let tokenAdmin: string;
let tokenEstudiante: string;

beforeEach(async () => {
  await limpiarBase();
  await asegurarAdmin({ nombre: 'Administrador', email: 'admin@uni.edu', password: 'admin12345' });
  await registrar({ nombre: 'Ana Pérez', email: 'ana@uni.edu', password: 'secreta123' });
  tokenAdmin = (await iniciarSesion({ email: 'admin@uni.edu', password: 'admin12345' })).token;
  tokenEstudiante = (await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' })).token;
});
afterAll(() => prisma.$disconnect());

function crear(nombre: unknown, token?: string) {
  const solicitud = request(app).post('/api/categorias');
  if (token) solicitud.set('Authorization', `Bearer ${token}`);
  return solicitud.send({ nombre });
}

describe('POST /api/categorias (HU-06a)', () => {
  it('un administrador crea una categoría válida → 201', async () => {
    const res = await crear('Matemática', tokenAdmin);

    expect(res.status).toBe(201);
    expect(res.body.categoria).toMatchObject({ id: expect.any(Number), nombre: 'Matemática' });
  });

  it('recorta los espacios del nombre', async () => {
    const res = await crear('  Física  ', tokenAdmin);

    expect(res.body.categoria.nombre).toBe('Física');
  });

  it('un nombre repetido con otras mayúsculas → 409', async () => {
    await crear('Matemática', tokenAdmin);

    const res = await crear('MATEMÁTICA', tokenAdmin);

    expect(res.status).toBe(409);
  });

  it.each([
    ['vacío', ''],
    ['de un carácter', 'A'],
    ['de más de 50 caracteres', 'x'.repeat(51)],
    ['ausente', undefined],
  ])('un nombre %s → 400 con el detalle en "nombre"', async (_caso, nombre) => {
    const res = await crear(nombre, tokenAdmin);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('nombre');
  });

  it('un estudiante → 403 y no se crea nada', async () => {
    const res = await crear('Física', tokenEstudiante);

    expect(res.status).toBe(403);
    expect(await prisma.categoria.count()).toBe(0);
  });

  it('sin token → 401', async () => {
    const res = await crear('Física');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/categorias (HU-06a)', () => {
  it('cualquier visitante lista las categorías en orden alfabético → 200', async () => {
    await crear('Programación', tokenAdmin);
    await crear('Física', tokenAdmin);

    const res = await request(app).get('/api/categorias');

    expect(res.status).toBe(200);
    expect(res.body.categorias.map((c: { nombre: string }) => c.nombre)).toEqual(['Física', 'Programación']);
  });

  it('no expone el nombre normalizado', async () => {
    await crear('Física', tokenAdmin);

    const res = await request(app).get('/api/categorias');

    expect(Object.keys(res.body.categorias[0]).sort()).toEqual(['creadoEn', 'id', 'nombre']);
  });
});
