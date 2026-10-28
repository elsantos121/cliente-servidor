import assert from 'node:assert/strict';
import { Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import type { ForoWorld } from '../support/world';

const app = crearApp();

When('consulto el estado de la API', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/salud');
});

When('hago GET a {string}', async function (this: ForoWorld, ruta: string) {
  this.respuesta = await request(app).get(ruta);
});

Then('la respuesta tiene código {int}', function (this: ForoWorld, codigo: number) {
  assert.equal(this.respuesta?.status, codigo);
});

Then('el estado informado es {string}', function (this: ForoWorld, estado: string) {
  assert.equal(this.respuesta?.body.estado, estado);
});
