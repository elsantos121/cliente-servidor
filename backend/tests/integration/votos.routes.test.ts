import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/app';
import { iniciarSesion, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { comentar } from '../../src/modules/comentarios/comentarios.service';
import { crearPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { limpiarBase, prisma } from '../helpers/db';

const app = crearApp();
let anaId: number;
let betoId: number;
let tokenAna: string;
let tokenBeto: string;
let publicacionId: number;
let comentarioId: number;

beforeEach(async () => {
  await limpiarBase();
  anaId = (await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' })).id;
  betoId = (await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' })).id;
  tokenAna = (await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' })).token;
  tokenBeto = (await iniciarSesion({ email: 'beto@uni.edu', password: 'secreta123' })).token;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(anaId, {
      titulo: 'Ayuda con límites',
      contenido: 'Necesito ayuda con el ejercicio 3 del práctico.',
      categoriaId,
    })
  ).id;
  comentarioId = (await comentar(publicacionId, anaId, { contenido: 'Probá con L’Hôpital.' })).id;
});

afterAll(() => prisma.$disconnect());

describe('PUT /api/votos/publicaciones/:id (HU-07)', () => {
  it('vota y cambia el voto sin duplicar; responde con el resumen para el usuario', async () => {
    const primera = await request(app)
      .put(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'POSITIVO' });
    const segunda = await request(app)
      .put(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'NEGATIVO' });

    expect(primera.status).toBe(200);
    expect(segunda.body.votos).toEqual({ positivos: 0, negativos: 1, miVoto: 'NEGATIVO' });
    expect(await prisma.votoPublicacion.count({ where: { usuarioId: betoId, publicacionId } })).toBe(1);
  });

  it('sin sesión responde 401; con un valor inválido responde 400', async () => {
    const sinSesion = await request(app).put(`/api/votos/publicaciones/${publicacionId}`).send({ valor: 'NEUTRO' });
    const invalido = await request(app)
      .put(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'NEUTRO' });

    expect(sinSesion.status).toBe(401);
    expect(invalido.status).toBe(400);
    expect(invalido.body.error.detalles).toHaveProperty('valor');
  });

  it('el autor no puede votarse y un id inexistente responde 404', async () => {
    const propio = await request(app)
      .put(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ valor: 'POSITIVO' });
    const inexistente = await request(app)
      .put('/api/votos/publicaciones/9999')
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'POSITIVO' });

    expect(propio.status).toBe(403);
    expect(inexistente.status).toBe(404);
  });
});

describe('DELETE /api/votos/publicaciones/:id (HU-07)', () => {
  it('retira el voto de quien inició sesión', async () => {
    await request(app)
      .put(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'POSITIVO' });

    const res = await request(app)
      .delete(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`);

    expect(res.status).toBe(200);
    expect(res.body.votos).toEqual({ positivos: 0, negativos: 0, miVoto: null });
  });
});

describe('GET de publicaciones y comentarios con resumen de votos (HU-07)', () => {
  it('muestra el voto propio si el token es válido y los conteos a visitantes', async () => {
    await request(app)
      .put(`/api/votos/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'POSITIVO' });

    const visitante = await request(app).get(`/api/publicaciones/${publicacionId}`);
    const usuario = await request(app)
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', `Bearer ${tokenBeto}`);

    expect(visitante.body.publicacion.votos).toEqual({ positivos: 1, negativos: 0, miVoto: null });
    expect(usuario.body.publicacion.votos).toEqual({ positivos: 1, negativos: 0, miVoto: 'POSITIVO' });
  });

  it('muestra los conteos y el voto propio para los comentarios', async () => {
    await request(app)
      .put(`/api/votos/comentarios/${comentarioId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'NEGATIVO' });

    const res = await request(app)
      .get(`/api/publicaciones/${publicacionId}/comentarios`)
      .set('Authorization', `Bearer ${tokenBeto}`);

    expect(res.body.comentarios[0].votos).toEqual({ positivos: 0, negativos: 1, miVoto: 'NEGATIVO' });
  });

  it('un token inválido en una consulta pública responde 401', async () => {
    const res = await request(app)
      .get(`/api/publicaciones/${publicacionId}`)
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
  });

  it('permite retirar el voto de un comentario', async () => {
    await request(app)
      .put(`/api/votos/comentarios/${comentarioId}`)
      .set('Authorization', `Bearer ${tokenBeto}`)
      .send({ valor: 'NEGATIVO' });

    const res = await request(app)
      .delete(`/api/votos/comentarios/${comentarioId}`)
      .set('Authorization', `Bearer ${tokenBeto}`);

    expect(res.status).toBe(200);
    expect(res.body.votos).toEqual({ positivos: 0, negativos: 0, miVoto: null });
  });
});
