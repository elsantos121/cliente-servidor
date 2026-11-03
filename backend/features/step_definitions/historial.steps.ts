import { Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { prisma } from '../../src/db/prisma';
import type { ForoWorld } from '../support/world';

const app = crearApp();
const rutaHistorial = '/api/moderacion/historial';

async function idPublicacion(titulo: string): Promise<number> {
  const publicacion = await prisma.publicacion.findFirstOrThrow({ where: { titulo }, select: { id: true } });
  return publicacion.id;
}

When('consulto el historial', async function (this: ForoWorld) {
  this.respuesta = await request(app).get(rutaHistorial).set('Authorization', `Bearer ${this.token}`);
});

When('consulto el historial sin iniciar sesión', async function (this: ForoWorld) {
  this.respuesta = await request(app).get(rutaHistorial);
});

When('consulto el historial de la publicación {string}', async function (this: ForoWorld, titulo: string) {
  const publicacionId = await idPublicacion(titulo);
  this.respuesta = await request(app)
    .get(`${rutaHistorial}?publicacionId=${publicacionId}`)
    .set('Authorization', `Bearer ${this.token}`);
});

Then('el historial registra las acciones {string} en ese orden', function (this: ForoWorld, acciones: string) {
  assert.deepEqual(
    this.respuesta?.body.eventos.map((evento: { accion: string }) => evento.accion),
    acciones.split(','),
  );
});

Then(
  'la publicación {string} está eliminada lógicamente conservando comentarios y reportes',
  async function (titulo: string) {
    const publicacion = await prisma.publicacion.findFirstOrThrow({
      where: { titulo },
      select: { id: true, eliminadaEn: true },
    });
    assert.ok(publicacion.eliminadaEn);
    assert.equal(await prisma.comentario.count({ where: { publicacionId: publicacion.id } }), 1);
    assert.equal(await prisma.reporte.count({ where: { publicacionId: publicacion.id } }), 1);
  },
);
