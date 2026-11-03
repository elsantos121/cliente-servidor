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
    await crearPublicacion(ana.id, {
      titulo: 'Publicación dudosa',
      contenido: 'Un contenido que alguien denunciará.',
      categoriaId,
    })
  ).id;
  reporteId = (await denunciar(publicacionId, beto.id, { motivo: 'Contenido ofensivo' })).id;
});

afterAll(() => prisma.$disconnect());

const historial = '/api/moderacion/historial';

describe('GET /api/moderacion/historial (HU-09)', () => {
  it('solo ADMIN consulta, filtra por recurso y acción, y recibe los eventos más recientes primero', async () => {
    await request(app)
      .patch(`/api/publicaciones/${publicacionId}/moderacion`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ oculta: true });
    await request(app)
      .patch(`/api/reportes/${reporteId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'RESUELTO' });

    const res = await request(app)
      .get(`${historial}?publicacionId=${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.eventos.map((evento: { accion: string }) => evento.accion)).toEqual([
      'REPORTE_RESUELTO',
      'PUBLICACION_OCULTADA',
    ]);
    expect(res.body.eventos[0]).toMatchObject({
      actor: { nombre: 'Admin', rol: 'ADMIN' },
      publicacion: { id: publicacionId, titulo: 'Publicación dudosa' },
      reporte: { id: reporteId, estado: 'RESUELTO' },
    });

    const filtrado = await request(app)
      .get(`${historial}?publicacionId=${publicacionId}&accion=PUBLICACION_OCULTADA`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(filtrado.body.eventos).toHaveLength(1);
    expect(filtrado.body.eventos[0].accion).toBe('PUBLICACION_OCULTADA');
  });

  it('sin sesión responde 401; estudiante responde 403', async () => {
    expect((await request(app).get(historial)).status).toBe(401);
    expect((await request(app).get(historial).set('Authorization', `Bearer ${tokenBeto}`)).status).toBe(403);
  });

  it('valida filtros y responde 404 para una publicación inexistente', async () => {
    const accionInvalida = await request(app)
      .get(`${historial}?accion=NO_EXISTE`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    const idInvalido = await request(app)
      .get(`${historial}?publicacionId=no-es-id`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    const inexistente = await request(app)
      .get(`${historial}?publicacionId=9999`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(accionInvalida.status).toBe(400);
    expect(idInvalido.status).toBe(400);
    expect(inexistente.status).toBe(404);
  });
});
