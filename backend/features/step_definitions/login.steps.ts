import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import request from 'supertest';
import { crearApp } from '../../src/app';
import { asegurarAdmin } from '../../src/modules/auth/auth.service';
import type { ForoWorld } from '../support/world';

const app = crearApp();

function iniciarSesion(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

Given(
  'que existe el administrador creado por el seed con correo {string} y contraseña {string}',
  async function (email: string, password: string) {
    await asegurarAdmin({ nombre: 'Administrador', email, password });
  },
);

Given(
  'que inicié sesión con correo {string} y contraseña {string}',
  async function (this: ForoWorld, email: string, password: string) {
    const res = await iniciarSesion(email, password);
    assert.equal(res.status, 200);
    this.token = res.body.token;
  },
);

When(
  'inicio sesión con correo {string} y contraseña {string}',
  async function (this: ForoWorld, email: string, password: string) {
    this.respuesta = await iniciarSesion(email, password);
  },
);

When('consulto mis datos de usuario', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/usuarios/me').set('Authorization', `Bearer ${this.token}`);
});

When('consulto mis datos de usuario sin token', async function (this: ForoWorld) {
  this.respuesta = await request(app).get('/api/usuarios/me');
});

When('consulto mis datos de usuario con el token alterado', async function (this: ForoWorld) {
  // Se cambia el contenido (rol ADMIN) conservando la firma original: la firma deja de coincidir.
  const [cabecera, , firma] = this.token!.split('.');
  const contenido = Buffer.from(JSON.stringify({ sub: '1', rol: 'ADMIN' })).toString('base64url');
  this.respuesta = await request(app)
    .get('/api/usuarios/me')
    .set('Authorization', `Bearer ${cabecera}.${contenido}.${firma}`);
});

Then('recibo un token de acceso', function (this: ForoWorld) {
  assert.equal(typeof this.respuesta?.body.token, 'string');
  assert.equal(this.respuesta?.body.token.split('.').length, 3);
});

Then('el mensaje de error es {string}', function (this: ForoWorld, mensaje: string) {
  assert.equal(this.respuesta?.body.error?.mensaje, mensaje);
});
