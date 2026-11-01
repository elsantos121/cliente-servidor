import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { asegurarAdmin, iniciarSesion, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();
const tokens: Record<'ana' | 'beto' | 'admin', string> = { ana: '', beto: '', admin: '' };
let matematica: number;
let programacion: number;

beforeEach(async () => {
  await limpiarBase();
  await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' });
  await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' });
  await asegurarAdmin({ nombre: 'Admin', email: 'admin@uni.edu', password: 'admin12345' });
  tokens.ana = (await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' })).token;
  tokens.beto = (await iniciarSesion({ email: 'beto@uni.edu', password: 'secreta123' })).token;
  tokens.admin = (await iniciarSesion({ email: 'admin@uni.edu', password: 'admin12345' })).token;
  matematica = (await crearCategoria({ nombre: 'Matemática' })).id;
  programacion = (await crearCategoria({ nombre: 'Programación' })).id;
});
afterAll(() => prisma.$disconnect());

const cuerpo = (extra: Record<string, unknown> = {}) => ({
  titulo: 'Ayuda con límites',
  contenido: 'Necesito ayuda con el ejercicio 3 del práctico.',
  categoriaId: matematica,
  ...extra,
});

function publicar(token: string | undefined, datos: Record<string, unknown> = cuerpo()) {
  const solicitud = request(app).post('/api/publicaciones');
  if (token) solicitud.set('Authorization', `Bearer ${token}`);
  return solicitud.send(datos);
}

async function publicarComoAna(extra: Record<string, unknown> = {}): Promise<number> {
  const res = await publicar(tokens.ana, cuerpo(extra));
  expect(res.status).toBe(201);
  return res.body.publicacion.id;
}

describe('POST /api/publicaciones (HU-03)', () => {
  it('un usuario autenticado publica → 201 con autor y categoría', async () => {
    const res = await publicar(tokens.ana);

    expect(res.status).toBe(201);
    expect(res.body.publicacion).toMatchObject({
      titulo: 'Ayuda con límites',
      autor: { nombre: 'Ana' },
      categoria: { id: matematica, nombre: 'Matemática' },
    });
  });

  it('ignora un autorId enviado por el cliente', async () => {
    const res = await publicar(tokens.ana, cuerpo({ autorId: 999 }));

    expect(res.body.publicacion.autor.nombre).toBe('Ana');
  });

  it.each([
    ['título vacío', { titulo: '' }, 'titulo'],
    ['título de 2 caracteres', { titulo: 'ab' }, 'titulo'],
    ['título de más de 150', { titulo: 'x'.repeat(151) }, 'titulo'],
    ['contenido de menos de 10', { contenido: 'corto' }, 'contenido'],
    ['contenido de más de 5000', { contenido: 'x'.repeat(5001) }, 'contenido'],
    ['categoría ausente', { categoriaId: undefined }, 'categoriaId'],
    ['categoría no numérica', { categoriaId: 'abc' }, 'categoriaId'],
  ])('%s → 400 en "%s"', async (_caso, extra, campo) => {
    const res = await publicar(tokens.ana, cuerpo(extra));

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty(campo);
  });

  it('categoría inexistente → 400 en "categoriaId"', async () => {
    const res = await publicar(tokens.ana, cuerpo({ categoriaId: 9999 }));

    expect(res.status).toBe(400);
    expect(res.body.error.detalles.categoriaId).toBe('La categoría no existe');
  });

  it('sin token → 401', async () => {
    expect((await publicar(undefined)).status).toBe(401);
  });
});

describe('GET /api/publicaciones (HU-03)', () => {
  it('lista las más recientes primero (público)', async () => {
    await publicarComoAna({ titulo: 'Primera' });
    await publicarComoAna({ titulo: 'Segunda', categoriaId: programacion });

    const res = await request(app).get('/api/publicaciones');

    expect(res.status).toBe(200);
    expect(res.body.publicaciones.map((p: { titulo: string }) => p.titulo)).toEqual(['Segunda', 'Primera']);
  });

  it('filtra por ?categoriaId=', async () => {
    await publicarComoAna({ titulo: 'Primera' });
    await publicarComoAna({ titulo: 'Segunda', categoriaId: programacion });

    const res = await request(app).get(`/api/publicaciones?categoriaId=${programacion}`);

    expect(res.body.publicaciones.map((p: { titulo: string }) => p.titulo)).toEqual(['Segunda']);
  });

  it('un ?categoriaId= no numérico → 400', async () => {
    const res = await request(app).get('/api/publicaciones?categoriaId=abc');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/publicaciones/:id (HU-03)', () => {
  it('devuelve el detalle (público)', async () => {
    const id = await publicarComoAna();

    const res = await request(app).get(`/api/publicaciones/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.publicacion).toMatchObject({ id, contenido: expect.stringContaining('ejercicio 3') });
  });

  it.each(['9999', 'abc', '-1'])('un id inexistente o inválido (%s) → 404', async (id) => {
    const res = await request(app).get(`/api/publicaciones/${id}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/publicaciones/:id (HU-03)', () => {
  it('el autor la edita → 200', async () => {
    const id = await publicarComoAna();

    const res = await request(app)
      .put(`/api/publicaciones/${id}`)
      .set('Authorization', `Bearer ${tokens.ana}`)
      .send(cuerpo({ titulo: 'Título nuevo', categoriaId: programacion }));

    expect(res.status).toBe(200);
    expect(res.body.publicacion).toMatchObject({ titulo: 'Título nuevo', categoria: { id: programacion } });
  });

  it('otro estudiante → 403', async () => {
    const id = await publicarComoAna();

    const res = await request(app)
      .put(`/api/publicaciones/${id}`)
      .set('Authorization', `Bearer ${tokens.beto}`)
      .send(cuerpo({ titulo: 'Ajena' }));

    expect(res.status).toBe(403);
  });

  it('datos inválidos → 400', async () => {
    const id = await publicarComoAna();

    const res = await request(app)
      .put(`/api/publicaciones/${id}`)
      .set('Authorization', `Bearer ${tokens.ana}`)
      .send(cuerpo({ titulo: '' }));

    expect(res.status).toBe(400);
  });

  it('inexistente → 404 · sin token → 401', async () => {
    const inexistente = await request(app)
      .put('/api/publicaciones/9999')
      .set('Authorization', `Bearer ${tokens.ana}`)
      .send(cuerpo());
    const sinToken = await request(app).put('/api/publicaciones/9999').send(cuerpo());

    expect(inexistente.status).toBe(404);
    expect(sinToken.status).toBe(401);
  });
});

describe('DELETE /api/publicaciones/:id (HU-03)', () => {
  it('el autor la elimina → 204 y deja de existir', async () => {
    const id = await publicarComoAna();

    const res = await request(app).delete(`/api/publicaciones/${id}`).set('Authorization', `Bearer ${tokens.ana}`);

    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/publicaciones/${id}`)).status).toBe(404);
  });

  it('un administrador elimina una ajena → 204', async () => {
    const id = await publicarComoAna();

    const res = await request(app).delete(`/api/publicaciones/${id}`).set('Authorization', `Bearer ${tokens.admin}`);

    expect(res.status).toBe(204);
  });

  it('otro estudiante → 403 · inexistente → 404 · sin token → 401', async () => {
    const id = await publicarComoAna();

    const ajena = await request(app).delete(`/api/publicaciones/${id}`).set('Authorization', `Bearer ${tokens.beto}`);
    const inexistente = await request(app).delete('/api/publicaciones/9999').set('Authorization', `Bearer ${tokens.ana}`);
    const sinToken = await request(app).delete(`/api/publicaciones/${id}`);

    expect(ajena.status).toBe(403);
    expect(inexistente.status).toBe(404);
    expect(sinToken.status).toBe(401);
  });
});
