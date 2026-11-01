import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { denunciar as denunciarPublicacion } from '../../src/modules/reportes/reportes.service';
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

// HU-06b · Moderación

async function idReporteDe(titulo: string): Promise<number> {
  const { id } = await prisma.reporte.findFirstOrThrow({ where: { publicacion: { titulo } } });
  return id;
}

function cambiarEstado(world: ForoWorld, id: number, estado: string) {
  return request(app).patch(`/api/reportes/${id}`).set('Authorization', `Bearer ${world.token}`).send({ estado });
}

Given(
  'que {string} denunció {string} con el motivo {string}',
  async function (email: string, titulo: string, motivo: string) {
    const autor = await prisma.usuario.findUniqueOrThrow({ where: { email } });
    const publicacion = await prisma.publicacion.findFirstOrThrow({ where: { titulo } });
    await denunciarPublicacion(publicacion.id, autor.id, { motivo });
  },
);

When('consulto los reportes', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/reportes').set('Authorization', `Bearer ${this.token}`);
});

When(
  'cambio el estado del reporte de {string} a {string}',
  async function (this: ForoWorld, titulo: string, estado: string) {
    this.respuesta = await cambiarEstado(this, await idReporteDe(titulo), estado);
  },
);

When('cambio el estado de un reporte inexistente a {string}', async function (this: ForoWorld, estado: string) {
  this.respuesta = await cambiarEstado(this, 9999, estado);
});

Then(
  'los reportes listados son de {string} con el motivo {string} y estado {string}',
  function (this: ForoWorld, titulo: string, motivo: string, estado: string) {
    const reportes = this.respuesta?.body.reportes;
    assert.equal(reportes?.length, 1);
    assert.equal(reportes[0].publicacion.titulo, titulo);
    assert.equal(reportes[0].motivo, motivo);
    assert.equal(reportes[0].estado, estado);
  },
);

Then('el reporte de {string} queda en estado {string}', async function (titulo: string, estado: string) {
  const reporte = await prisma.reporte.findFirstOrThrow({ where: { publicacion: { titulo } } });
  assert.equal(reporte.estado, estado);
});

Then('no hay reportes pendientes', async function () {
  assert.equal(await prisma.reporte.count({ where: { estado: 'PENDIENTE' } }), 0);
});
