import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { comentar } from '../../src/modules/comentarios/comentarios.service';
import { prisma } from '../../tests/helpers/db';
import type { ForoWorld } from '../support/world';

const app = crearApp();

function lista(texto: string): string[] {
  return [...texto.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

async function rutaComentarios(titulo: string): Promise<string> {
  const { id } = await prisma.publicacion.findFirstOrThrow({ where: { titulo } });
  return `/api/publicaciones/${id}/comentarios`;
}

Given(
  'que {string} comentó {string} en la publicación {string}',
  async function (email: string, contenido: string, titulo: string) {
    const autor = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    const publicacion = await prisma.publicacion.findFirstOrThrow({ where: { titulo } });
    await comentar(publicacion.id, autor.id, { contenido });
  },
);

When('comento {string} en la publicación {string}', async function (this: ForoWorld, contenido: string, titulo: string) {
  this.respuesta = await request(app)
    .post(await rutaComentarios(titulo))
    .set('Authorization', `Bearer ${this.token}`)
    .send({ contenido });
});

When(
  'comento {string} en la publicación {string} sin iniciar sesión',
  async function (this: ForoWorld, contenido: string, titulo: string) {
    this.respuesta = await request(app).post(await rutaComentarios(titulo)).send({ contenido });
  },
);

When('comento {string} en una publicación inexistente', async function (this: ForoWorld, contenido: string) {
  this.respuesta = await request(app)
    .post('/api/publicaciones/9999/comentarios')
    .set('Authorization', `Bearer ${this.token}`)
    .send({ contenido });
});

When('consulto los comentarios de la publicación {string}', async function (this: ForoWorld, titulo: string) {
  this.respuesta = await request(app).get(await rutaComentarios(titulo));
});

When('consulto los comentarios de una publicación inexistente', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/publicaciones/9999/comentarios');
});

Then(
  'la respuesta incluye el comentario {string} de {string}',
  async function (this: ForoWorld, contenido: string, email: string) {
    const autor = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    assert.equal(this.respuesta?.body.comentario?.contenido, contenido);
    assert.equal(this.respuesta?.body.comentario?.autor?.id, autor.id);
  },
);

Then(/^los comentarios listados son (.+)$/, function (this: ForoWorld, texto: string) {
  const contenidos = this.respuesta?.body.comentarios.map((c: { contenido: string }) => c.contenido);
  assert.deepEqual(contenidos, lista(texto));
});
