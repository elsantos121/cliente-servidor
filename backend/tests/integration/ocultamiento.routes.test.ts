import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { asegurarAdmin, iniciarSesion, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { crearPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { denunciar } from '../../src/modules/reportes/reportes.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();
let tokenAna: string;
let tokenBeto: string;
let tokenAdmin: string;
let publicacionId: number;

beforeEach(async () => {
  await limpiarBase();
  const ana = await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' });
  const beto = await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' });
  await asegurarAdmin({ nombre: 'Admin', email: 'admin@uni.edu', password: 'admin12345' });
  tokenAna = (await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' })).token;
  tokenBeto = (await iniciarSesion({ email: 'beto@uni.edu', password: 'secreta123' })).token;
  tokenAdmin = (await iniciarSesion({ email: 'admin@uni.edu', password: 'admin12345' })).token;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(ana.id, {
      titulo: 'Ayuda con límites',
      contenido: 'Necesito ayuda con el ejercicio 3 del práctico.',
      categoriaId,
    })
  ).id;
  await denunciar(publicacionId, beto.id, { motivo: 'Contenido ofensivo' });
});

afterAll(() => prisma.$disconnect());

const ruta = () => `/api/publicaciones/${publicacionId}/moderacion`;

describe('PATCH /api/publicaciones/:id/moderacion (HU-08)', () => {
  it('un administrador oculta y restaura la publicación de manera idempotente', async () => {
    const ocultar = await request(app).patch(ruta()).set('Authorization', `Bearer ${tokenAdmin}`).send({ oculta: true });
    const repetir = await request(app).patch(ruta()).set('Authorization', `Bearer ${tokenAdmin}`).send({ oculta: true });
    const restaurar = await request(app).patch(ruta()).set('Authorization', `Bearer ${tokenAdmin}`).send({ oculta: false });

    expect(ocultar.status).toBe(200);
    expect(ocultar.body.publicacion.ocultaEn).toEqual(expect.any(String));
    expect(repetir.body.publicacion.ocultaEn).toBe(ocultar.body.publicacion.ocultaEn);
    expect(restaurar.status).toBe(200);
    expect(restaurar.body.publicacion.ocultaEn).toBeNull();
  });

  it('sin sesión responde 401; estudiante responde 403; visibilidad inválida responde 400', async () => {
    const sinSesion = await request(app).patch(ruta()).send({ oculta: true });
    const estudiante = await request(app)
      .patch(ruta())
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ oculta: true });
    const invalida = await request(app)
      .patch(ruta())
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ oculta: 'sí' });

    expect(sinSesion.status).toBe(401);
    expect(estudiante.status).toBe(403);
    expect(invalida.status).toBe(400);
    expect(invalida.body.error.detalles).toHaveProperty('oculta');
  });

  it('una publicación inexistente responde 404', async () => {
    const res = await request(app)
      .patch('/api/publicaciones/9999/moderacion')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ oculta: true });

    expect(res.status).toBe(404);
  });
});

describe('publicaciones ocultas (HU-08)', () => {
  it('no aparecen en listados/detalles y no admiten comentarios ni denuncias', async () => {
    await request(app).patch(ruta()).set('Authorization', `Bearer ${tokenAdmin}`).send({ oculta: true });
    const listado = await request(app).get('/api/publicaciones');
    const detalle = await request(app).get(`/api/publicaciones/${publicacionId}`);
    const comentarios = await request(app).get(`/api/publicaciones/${publicacionId}/comentarios`);
    const comentar = await request(app)
      .post(`/api/publicaciones/${publicacionId}/comentarios`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ contenido: '¿Puedo comentar?' });
    const reportar = await request(app)
      .post(`/api/publicaciones/${publicacionId}/reportes`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ motivo: 'Otro reporte' });

    expect(listado.body.publicaciones).toEqual([]);
    expect(detalle.status).toBe(404);
    expect(comentarios.status).toBe(404);
    expect(comentar.status).toBe(404);
    expect(reportar.status).toBe(404);
  });

  it('el panel de reportes muestra si la publicación está oculta', async () => {
    await request(app).patch(ruta()).set('Authorization', `Bearer ${tokenAdmin}`).send({ oculta: true });
    const res = await request(app).get('/api/reportes').set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.body.reportes[0].publicacion.ocultaEn).toEqual(expect.any(String));
  });
});
