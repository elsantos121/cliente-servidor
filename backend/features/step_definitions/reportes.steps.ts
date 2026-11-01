import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { prisma } from '../../tests/helpers/db';
import type { ForoWorld } from '../support/world';

const app = crearApp();

async function rutaDenuncias(titulo: string): Promise<string> {
  const { id } = await prisma.publicacion.findFirstOrThrow({ where: { titulo } });
  return `/api/publicaciones/${id}/reportes`;
}

async function denunciar(world: ForoWorld, ruta: string, motivo: string) {
  return request(app).post(ruta).set('Authorization', `Bearer ${world.token}`).send({ motivo });
}

Given(
  'que denuncié la publicación {string} con el motivo {string}',
  async function (this: ForoWorld, titulo: string, motivo: string) {
    const res = await denunciar(this, await rutaDenuncias(titulo), motivo);
    assert.equal(res.status, 201);
  },
);

When(
  'denuncio la publicación {string} con el motivo {string}',
  async function (this: ForoWorld, titulo: string, motivo: string) {
    this.respuesta = await denunciar(this, await rutaDenuncias(titulo), motivo);
  },
);

When('denuncio una publicación inexistente con el motivo {string}', async function (this: ForoWorld, motivo: string) {
  this.respuesta = await denunciar(this, '/api/publicaciones/9999/reportes', motivo);
});

When('denuncio la publicación {string} sin iniciar sesión', async function (this: ForoWorld, titulo: string) {
  this.respuesta = await request(app).post(await rutaDenuncias(titulo)).send({ motivo: 'Contenido ofensivo' });
});

Then(
  'la denuncia queda en estado {string} con el motivo {string} de {string}',
  async function (this: ForoWorld, estado: string, motivo: string, email: string) {
    assert.equal(this.respuesta?.body.reporte?.estado, estado);
    assert.equal(this.respuesta?.body.reporte?.motivo, motivo);
    const autor = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    const guardado = await prisma.reporte.findUniqueOrThrow({ where: { id: this.respuesta?.body.reporte.id } });
    assert.equal(guardado.autorId, autor.id);
  },
);

Then('hay {int} denuncia(s) de la publicación {string}', async function (cantidad: number, titulo: string) {
  const { id } = await prisma.publicacion.findFirstOrThrow({ where: { titulo } });
  assert.equal(await prisma.reporte.count({ where: { publicacionId: id } }), cantidad);
});
