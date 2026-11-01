import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  asegurarAdmin,
  iniciarSesion,
  registrar,
  verificarToken,
} from '../../src/modules/auth/auth.service';
import { limpiarBase, prisma } from '../helpers/db';

describe('auth.service · iniciarSesion y tokens (HU-02)', () => {
  beforeEach(async () => {
    await limpiarBase();
    await registrar({ nombre: 'Ana Pérez', email: 'ana@uni.edu', password: 'secreta123' });
  });
  afterAll(() => prisma.$disconnect());

  it('con credenciales válidas devuelve un token y los datos públicos del usuario', async () => {
    const { token, usuario } = await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' });

    expect(typeof token).toBe('string');
    expect(usuario).toEqual({
      id: expect.any(Number),
      nombre: 'Ana Pérez',
      email: 'ana@uni.edu',
      rol: 'ESTUDIANTE',
      creadoEn: expect.any(Date),
    });
  });

  it('no distingue mayúsculas en el correo', async () => {
    const { usuario } = await iniciarSesion({ email: 'ANA@uni.edu', password: 'secreta123' });

    expect(usuario.email).toBe('ana@uni.edu');
  });

  it('el token identifica al usuario y su rol, y expira', async () => {
    const { token, usuario } = await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' });

    const contenido = verificarToken(token);
    expect(contenido).toMatchObject({ id: usuario.id, rol: 'ESTUDIANTE' });
    const decodificado = jwt.decode(token) as jwt.JwtPayload;
    expect(decodificado.exp).toBeGreaterThan(decodificado.iat!);
  });

  it('con contraseña incorrecta responde 401 con un mensaje genérico', async () => {
    const intento = iniciarSesion({ email: 'ana@uni.edu', password: 'incorrecta' });

    await expect(intento).rejects.toMatchObject({
      status: 401,
      message: 'Correo o contraseña incorrectos',
    });
  });

  it('con correo inexistente responde 401 con el mismo mensaje genérico', async () => {
    const intento = iniciarSesion({ email: 'nadie@uni.edu', password: 'secreta123' });

    await expect(intento).rejects.toMatchObject({
      status: 401,
      message: 'Correo o contraseña incorrectos',
    });
  });

  it('verificarToken rechaza un token alterado (401)', async () => {
    const { token } = await iniciarSesion({ email: 'ana@uni.edu', password: 'secreta123' });
    const alterado = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');

    expect(() => verificarToken(alterado)).toThrow(expect.objectContaining({ status: 401 }));
  });

  it('verificarToken rechaza un token firmado con otro secreto (401)', () => {
    const falso = jwt.sign({ sub: '1', rol: 'ADMIN' }, 'otro-secreto-de-al-menos-16');

    expect(() => verificarToken(falso)).toThrow(expect.objectContaining({ status: 401 }));
  });
});

describe('auth.service · asegurarAdmin (seed)', () => {
  beforeEach(limpiarBase);
  afterAll(() => prisma.$disconnect());

  const admin = { nombre: 'Administrador', email: 'Admin@uni.edu', password: 'admin12345' };

  it('crea el administrador con rol ADMIN y puede iniciar sesión', async () => {
    await asegurarAdmin(admin);

    const { usuario } = await iniciarSesion({ email: 'admin@uni.edu', password: 'admin12345' });
    expect(usuario.rol).toBe('ADMIN');
  });

  it('es idempotente: ejecutarlo dos veces no duplica el administrador', async () => {
    await asegurarAdmin(admin);
    await asegurarAdmin(admin);

    expect(await prisma.usuario.count({ where: { rol: 'ADMIN' } })).toBe(1);
  });
});
