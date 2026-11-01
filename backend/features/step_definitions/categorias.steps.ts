import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { listaEntreComillas } from '../support/texto';
import type { ForoWorld } from '../support/world';

const app = crearApp();

Given(/^que existen las categorías (.+)$/, async function (texto: string) {
  for (const nombre of listaEntreComillas(texto)) {
    await crearCategoria({ nombre });
  }
});

When('creo la categoría {string}', async function (this: ForoWorld, nombre: string) {
  this.respuesta = await request(app)
    .post('/api/categorias')
    .set('Authorization', `Bearer ${this.token}`)
    .send({ nombre });
});

When('creo la categoría {string} sin iniciar sesión', async function (this: ForoWorld, nombre: string) {
  this.respuesta = await request(app).post('/api/categorias').send({ nombre });
});

When('consulto las categorías sin iniciar sesión', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/categorias');
});

Then('la respuesta incluye la categoría {string}', function (this: ForoWorld, nombre: string) {
  assert.equal(this.respuesta?.body.categoria?.nombre, nombre);
});

Then(/^las categorías listadas son (.+)$/, function (this: ForoWorld, texto: string) {
  const nombres = this.respuesta?.body.categorias.map((c: { nombre: string }) => c.nombre);
  assert.deepEqual(nombres, listaEntreComillas(texto));
});
