import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { prisma } from '../../tests/helpers/db';
import type { ForoWorld } from '../support/world';

const app = crearApp();

async function idPublicacion(titulo: string): Promise<number> {
  return (await prisma.publicacion.findFirstOrThrow({ where: { titulo } })).id;
}

function conToken(world: ForoWorld, solicitud: request.Test): request.Test {
  return world.token ? solicitud.set('Authorization', `Bearer ${world.token}`) : solicitud;
}

When(
  'voto {string} en la publicación {string}',
  async function (this: ForoWorld, valor: string, titulo: string) {
    const id = await idPublicacion(titulo);
    this.respuesta = await conToken(this, request(app).put(`/api/votos/publicaciones/${id}`)).send({ valor });
  },
);

When(
  'voto {string} en la publicación {string} sin iniciar sesión',
  async function (this: ForoWorld, valor: string, titulo: string) {
    const id = await idPublicacion(titulo);
    this.respuesta = await request(app).put(`/api/votos/publicaciones/${id}`).send({ valor });
  },
);

Given(
  'que {string} comentó {string} en {string}',
  async function (email: string, contenido: string, titulo: string) {
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    const publicacionId = await idPublicacion(titulo);
    await prisma.comentario.create({ data: { contenido, autorId: usuario.id, publicacionId } });
  },
);

When(
  'voto {string} en el comentario de {string}',
  async function (this: ForoWorld, valor: string, titulo: string) {
    const comentario = await prisma.comentario.findFirstOrThrow({ where: { publicacion: { titulo } } });
    this.respuesta = await conToken(
      this,
      request(app).put(`/api/votos/comentarios/${comentario.id}`),
    ).send({ valor });
  },
);

Then(
  'el voto de {string} en {string} es {string}',
  async function (this: ForoWorld, email: string, titulo: string, valor: string) {
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    const publicacionId = await idPublicacion(titulo);
    const voto = await prisma.votoPublicacion.findUniqueOrThrow({
      where: { usuarioId_publicacionId: { usuarioId: usuario.id, publicacionId } },
    });
    assert.equal(voto.valor, valor);
  },
);

Then(
  'el comentario de {string} tiene {int} voto positivo y {int} negativos',
  async function (this: ForoWorld, titulo: string, positivos: number, negativos: number) {
    const comentario = await prisma.comentario.findFirstOrThrow({ where: { publicacion: { titulo } } });
    assert.equal(
      await prisma.votoComentario.count({ where: { comentarioId: comentario.id, valor: 'POSITIVO' } }),
      positivos,
    );
    assert.equal(
      await prisma.votoComentario.count({ where: { comentarioId: comentario.id, valor: 'NEGATIVO' } }),
      negativos,
    );
  },
);
