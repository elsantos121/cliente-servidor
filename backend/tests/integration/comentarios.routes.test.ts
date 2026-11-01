import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { iniciarSesion, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { crearPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();
let tokenBeto: string;
let publicacionId: number;

beforeEach(async () => {
  await limpiarBase();
  const ana = await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' });
  await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' });
  tokenBeto = (await iniciarSesion({ email: 'beto@uni.edu', password: 'secreta123' })).token;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(ana.id, { titulo: 'Ayuda con límites', contenido: 'No entiendo el ejercicio 3.', categoriaId })
  ).id;
});
afterAll(() => prisma.$disconnect());

const ruta = (id: number | string = publicacionId) => `/api/publicaciones/${id}/comentarios`;

function comentar(contenido: unknown, token: string | null = tokenBeto, id: number | string = publicacionId) {
  const solicitud = request(app).post(ruta(id));
  if (token) solicitud.set('Authorization', `Bearer ${token}`);
  return solicitud.send({ contenido });
}

describe('POST /api/publicaciones/:id/comentarios (HU-04)', () => {
  it('un usuario autenticado comenta → 201 con el autor', async () => {
    const res = await comentar('Probá con L’Hôpital');

    expect(res.status).toBe(201);
    expect(res.body.comentario).toMatchObject({ contenido: 'Probá con L’Hôpital', autor: { nombre: 'Beto' } });
  });

  it('recorta espacios del contenido', async () => {
    const res = await comentar('   Hola   ');

    expect(res.body.comentario.contenido).toBe('Hola');
  });

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['de más de 2000 caracteres', 'x'.repeat(2001)],
    ['ausente', undefined],
  ])('contenido %s → 400 en "contenido"', async (_caso, contenido) => {
    const res = await comentar(contenido);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('contenido');
  });

  it('acepta exactamente 2000 caracteres', async () => {
    expect((await comentar('x'.repeat(2000))).status).toBe(201);
  });

  it('sin token → 401', async () => {
    expect((await comentar('Hola', null)).status).toBe(401);
  });

  it.each(['9999', 'abc'])('publicación inexistente o inválida (%s) → 404', async (id) => {
    expect((await comentar('Hola', tokenBeto, id)).status).toBe(404);
  });
});

describe('GET /api/publicaciones/:id/comentarios (HU-04)', () => {
  it('lista los comentarios, los más antiguos primero (público)', async () => {
    await comentar('Primero');
    await comentar('Segundo');

    const res = await request(app).get(ruta());

    expect(res.status).toBe(200);
    expect(res.body.comentarios.map((c: { contenido: string }) => c.contenido)).toEqual(['Primero', 'Segundo']);
    expect(res.body.comentarios[0].autor).toEqual({ id: expect.any(Number), nombre: 'Beto' });
  });

  it.each(['9999', 'abc'])('publicación inexistente o inválida (%s) → 404', async (id) => {
    expect((await request(app).get(ruta(id))).status).toBe(404);
  });

  it('no afecta al detalle de la publicación (GET /api/publicaciones/:id sigue respondiendo)', async () => {
    const res = await request(app).get(`/api/publicaciones/${publicacionId}`);

    expect(res.status).toBe(200);
  });
});
