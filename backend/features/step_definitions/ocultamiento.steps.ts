import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
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
  'cambio la visibilidad de {string} a {string}',
  async function (this: ForoWorld, titulo: string, visibilidad: string) {
    const id = await idPublicacion(titulo);
    this.respuesta = await conToken(this, request(app).patch(`/api/publicaciones/${id}/moderacion`)).send({
      oculta: visibilidad === 'oculta',
    });
  },
);

When(
  'cambio la visibilidad de {string} a {string} sin iniciar sesión',
  async function (this: ForoWorld, titulo: string, visibilidad: string) {
    const id = await idPublicacion(titulo);
    this.respuesta = await request(app).patch(`/api/publicaciones/${id}/moderacion`).send({
      oculta: visibilidad === 'oculta',
    });
  },
);

Then('la publicación {string} está oculta en el reporte', function (this: ForoWorld, _titulo: string) {
  assert.ok(this.respuesta?.body.publicacion?.ocultaEn);
});
