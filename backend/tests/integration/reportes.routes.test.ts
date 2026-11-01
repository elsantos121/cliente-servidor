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
    await crearPublicacion(ana.id, { titulo: 'Publicación dudosa', contenido: 'Un contenido que alguien denunciará.', categoriaId })
  ).id;
});
afterAll(() => prisma.$disconnect());

function denunciar(motivo: unknown, token: string | null = tokenBeto, id: number | string = publicacionId) {
  const solicitud = request(app).post(`/api/publicaciones/${id}/reportes`);
  if (token) solicitud.set('Authorization', `Bearer ${token}`);
  return solicitud.send({ motivo });
}

describe('POST /api/publicaciones/:id/reportes (HU-05)', () => {
  it('un usuario autenticado denuncia → 201 con estado PENDIENTE', async () => {
    const res = await denunciar('Contenido ofensivo');

    expect(res.status).toBe(201);
    expect(res.body.reporte).toMatchObject({
      motivo: 'Contenido ofensivo',
      estado: 'PENDIENTE',
      publicacion: { id: publicacionId, titulo: 'Publicación dudosa' },
    });
  });

  it('ignora un estado enviado por el cliente: siempre PENDIENTE', async () => {
    const res = await request(app)
      .post(`/api/publicaciones/${publicacionId}/reportes`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ motivo: 'Contenido ofensivo', estado: 'RESUELTO' });

    expect(res.body.reporte.estado).toBe('PENDIENTE');
  });

  it('denunciar dos veces la misma publicación → 409', async () => {
    await denunciar('Contenido ofensivo');

    const res = await denunciar('Sigue siendo ofensivo');

    expect(res.status).toBe(409);
    expect(res.body.error.mensaje).toBe('Ya denunciaste esta publicación');
  });

  it.each([
    ['vacío', ''],
    ['de 4 caracteres', 'Malo'],
    ['de más de 500 caracteres', 'x'.repeat(501)],
    ['ausente', undefined],
  ])('motivo %s → 400 en "motivo"', async (_caso, motivo) => {
    const res = await denunciar(motivo);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('motivo');
  });

  it('sin token → 401', async () => {
    expect((await denunciar('Contenido ofensivo', null)).status).toBe(401);
  });

  it.each(['9999', 'abc'])('publicación inexistente o inválida (%s) → 404', async (id) => {
    expect((await denunciar('Contenido ofensivo', tokenBeto, id)).status).toBe(404);
  });
});
