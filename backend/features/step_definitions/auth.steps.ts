import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { limpiarBase, prisma } from '../../tests/helpers/db';
import type { ForoWorld } from '../support/world';

const app = crearApp();

function registrarse(datos: Record<string, unknown>) {
  return request(app).post('/api/auth/registro').send(datos);
}

Given('que no hay usuarios registrados', async function () {
  await limpiarBase();
});

Given('que existe un usuario registrado con correo {string}', async function (email: string) {
  const res = await registrarse({ nombre: 'Usuario Existente', email, password: 'secreta123' });
  assert.equal(res.status, 201);
});

When(
  'me registro con nombre {string}, correo {string} y contraseña {string}',
  async function (this: ForoWorld, nombre: string, email: string, password: string) {
    this.respuesta = await registrarse({ nombre, email, password });
  },
);

When(
  'me registro con correo {string} enviando el rol {string}',
  async function (this: ForoWorld, email: string, rol: string) {
    this.respuesta = await registrarse({ nombre: 'Ana Pérez', email, password: 'secreta123', rol });
  },
);

Then('la respuesta incluye un usuario con rol {string}', function (this: ForoWorld, rol: string) {
  assert.equal(this.respuesta?.body.usuario?.rol, rol);
});

Then('la respuesta no incluye la contraseña ni su hash', function (this: ForoWorld) {
  assert.doesNotMatch(JSON.stringify(this.respuesta?.body), /password/i);
});

Then(
  'hay {int} usuario(s) registrado(s) con correo {string}',
  async function (cantidad: number, email: string) {
    assert.equal(await prisma.usuario.count({ where: { email } }), cantidad);
  },
);

Then('el error informa un problema en el campo {string}', function (this: ForoWorld, campo: string) {
  assert.equal(this.respuesta?.body.error?.codigo, 'VALIDACION');
  assert.ok(this.respuesta?.body.error?.detalles?.[campo], `sin detalle para "${campo}"`);
});
