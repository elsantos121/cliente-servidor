import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { asegurarAdmin, iniciarSesion, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { crearPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { denunciar } from '../../src/modules/reportes/reportes.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();
let tokenAdmin: string;
let tokenBeto: string;
let publicacionId: number;
let reporteId: number;

beforeEach(async () => {
  await limpiarBase();
  const ana = await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' });
  const beto = await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' });
  await asegurarAdmin({ nombre: 'Admin', email: 'admin@uni.edu', password: 'admin12345' });
  tokenAdmin = (await iniciarSesion({ email: 'admin@uni.edu', password: 'admin12345' })).token;
  tokenBeto = (await iniciarSesion({ email: 'beto@uni.edu', password: 'secreta123' })).token;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(ana.id, { titulo: 'Publicación dudosa', contenido: 'Un contenido que alguien denunciará.', categoriaId })
  ).id;
  reporteId = (await denunciar(publicacionId, beto.id, { motivo: 'Contenido ofensivo' })).id;
});
afterAll(() => prisma.$disconnect());

function listar(token: string | null, query = '') {
  const solicitud = request(app).get(`/api/reportes${query}`);
  if (token) solicitud.set('Authorization', `Bearer ${token}`);
  return solicitud;
}

function cambiar(id: number | string, estado: unknown, token: string | null = tokenAdmin) {
  const solicitud = request(app).patch(`/api/reportes/${id}`);
  if (token) solicitud.set('Authorization', `Bearer ${token}`);
  return solicitud.send({ estado });
}

describe('GET /api/reportes (HU-06b)', () => {
  it('un administrador lista los pendientes con publicación, autor y motivo → 200', async () => {
    const res = await listar(tokenAdmin);

    expect(res.status).toBe(200);
    expect(res.body.reportes).toEqual([
      expect.objectContaining({
        id: reporteId,
        motivo: 'Contenido ofensivo',
        estado: 'PENDIENTE',
        publicacion: { id: publicacionId, titulo: 'Publicación dudosa' },
        autor: expect.objectContaining({ nombre: 'Beto' }),
      }),
    ]);
  });

  it('filtra con ?estado=', async () => {
    await cambiar(reporteId, 'DESCARTADO');

    expect((await listar(tokenAdmin, '?estado=PENDIENTE')).body.reportes).toEqual([]);
    expect((await listar(tokenAdmin, '?estado=DESCARTADO')).body.reportes).toHaveLength(1);
  });

  it('un ?estado= inválido → 400', async () => {
    const res = await listar(tokenAdmin, '?estado=BORRADO');

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('estado');
  });

  it('un estudiante → 403 · sin token → 401', async () => {
    expect((await listar(tokenBeto)).status).toBe(403);
    expect((await listar(null)).status).toBe(401);
  });
});

describe('PATCH /api/reportes/:id (HU-06b)', () => {
  it.each(['RESUELTO', 'DESCARTADO'])('un administrador cambia el estado a %s → 200', async (estado) => {
    const res = await cambiar(reporteId, estado);

    expect(res.status).toBe(200);
    expect(res.body.reporte).toMatchObject({ id: reporteId, estado });
  });

  it.each([
    ['inexistente', 'BORRADO'],
    ['PENDIENTE (no se puede volver atrás)', 'PENDIENTE'],
    ['ausente', undefined],
  ])('un estado %s → 400 en "estado"', async (_caso, estado) => {
    const res = await cambiar(reporteId, estado);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toHaveProperty('estado');
  });

  it.each(['9999', 'abc'])('reporte inexistente o inválido (%s) → 404', async (id) => {
    expect((await cambiar(id, 'RESUELTO')).status).toBe(404);
  });

  it('un estudiante → 403 y el reporte no cambia · sin token → 401', async () => {
    expect((await cambiar(reporteId, 'DESCARTADO', tokenBeto)).status).toBe(403);
    expect((await cambiar(reporteId, 'DESCARTADO', null)).status).toBe(401);
    expect((await prisma.reporte.findUniqueOrThrow({ where: { id: reporteId } })).estado).toBe('PENDIENTE');
  });
});

describe('DELETE /api/publicaciones/:id por un administrador (HU-06b)', () => {
  it('elimina la publicación denunciada y sus reportes → 204', async () => {
    const res = await request(app).delete(`/api/publicaciones/${publicacionId}`).set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(204);
    expect((await listar(tokenAdmin)).body.reportes).toEqual([]);
  });
});
