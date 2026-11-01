import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { crearPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { prisma } from '../../tests/helpers/db';
import { listaEntreComillas } from '../support/texto';
import type { ForoWorld } from '../support/world';

const app = crearApp();

const CONTENIDO = 'Contenido de prueba con más de diez caracteres.';

async function idCategoria(nombre: string): Promise<number> {
  return (await prisma.categoria.findFirstOrThrow({ where: { nombre } })).id;
}

async function idPublicacion(titulo: string): Promise<number> {
  return (await prisma.publicacion.findFirstOrThrow({ where: { titulo } })).id;
}

function conToken(world: ForoWorld, solicitud: request.Test): request.Test {
  return world.token ? solicitud.set('Authorization', `Bearer ${world.token}`) : solicitud;
}

Given(
  'que {string} publicó {string} en la categoría {string}',
  async function (email: string, titulo: string, categoria: string) {
    const autor = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    await crearPublicacion(autor.id, { titulo, contenido: CONTENIDO, categoriaId: await idCategoria(categoria) });
  },
);

When(
  'creo una publicación titulada {string} con contenido {string} en la categoría {string}',
  async function (this: ForoWorld, titulo: string, contenido: string, categoria: string) {
    const datos = { titulo, contenido, categoriaId: await idCategoria(categoria) };
    this.respuesta = await conToken(this, request(app).post('/api/publicaciones')).send(datos);
  },
);

When('creo una publicación en una categoría inexistente', async function (this: ForoWorld) {
  const datos = { titulo: 'Sin categoría', contenido: CONTENIDO, categoriaId: 9999 };
  this.respuesta = await conToken(this, request(app).post('/api/publicaciones')).send(datos);
});

When('creo una publicación sin iniciar sesión', async function (this: ForoWorld) {
  const datos = { titulo: 'Anónima', contenido: CONTENIDO, categoriaId: 1 };
  this.respuesta = await request(app).post('/api/publicaciones').send(datos);
});

When('consulto las publicaciones', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/publicaciones');
});

When('consulto las publicaciones de la categoría {string}', async function (this: ForoWorld, categoria: string) {
  this.respuesta = await request(app).get(`/api/publicaciones?categoriaId=${await idCategoria(categoria)}`);
});

When('consulto la publicación {string}', async function (this: ForoWorld, titulo: string) {
  this.respuesta = await request(app).get(`/api/publicaciones/${await idPublicacion(titulo)}`);
});

When('consulto una publicación inexistente', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/publicaciones/9999');
});

When(
  'cambio el título de la publicación {string} por {string}',
  async function (this: ForoWorld, titulo: string, nuevoTitulo: string) {
    const actual = await prisma.publicacion.findFirstOrThrow({ where: { titulo } });
    const datos = { titulo: nuevoTitulo, contenido: actual.contenido, categoriaId: actual.categoriaId };
    this.respuesta = await conToken(this, request(app).put(`/api/publicaciones/${actual.id}`)).send(datos);
  },
);

When('elimino la publicación {string}', async function (this: ForoWorld, titulo: string) {
  this.respuesta = await conToken(this, request(app).delete(`/api/publicaciones/${await idPublicacion(titulo)}`));
});

Then(
  'la respuesta incluye la publicación {string} de {string}',
  async function (this: ForoWorld, titulo: string, email: string) {
    const autor = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    assert.equal(this.respuesta?.body.publicacion?.titulo, titulo);
    assert.equal(this.respuesta?.body.publicacion?.autor?.id, autor.id);
  },
);

Then(/^las publicaciones listadas son (.+)$/, function (this: ForoWorld, texto: string) {
  const titulos = this.respuesta?.body.publicaciones.map((p: { titulo: string }) => p.titulo);
  assert.deepEqual(titulos, listaEntreComillas(texto));
});

Then('la publicación {string} ya no existe', async function (titulo: string) {
  assert.equal(await prisma.publicacion.count({ where: { titulo } }), 0);
});
