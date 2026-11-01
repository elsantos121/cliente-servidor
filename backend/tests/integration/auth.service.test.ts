import bcrypt from 'bcryptjs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../../src/errors/AppError';
import { registrar } from '../../src/modules/auth/auth.service';
import { limpiarBase, prisma } from '../helpers/db';

// Pruebas del servicio contra la base de pruebas: Prisma es la capa de datos (ver docs/arquitectura.md).
describe('auth.service · registrar (HU-01)', () => {
  beforeEach(limpiarBase);
  afterAll(() => prisma.$disconnect());

  const datos = { nombre: 'Ana Pérez', email: 'ana@uni.edu', password: 'secreta123' };

  it('crea el usuario con rol ESTUDIANTE y devuelve solo sus datos públicos', async () => {
    const usuario = await registrar(datos);

    expect(usuario).toEqual({
      id: expect.any(Number),
      nombre: 'Ana Pérez',
      email: 'ana@uni.edu',
      rol: 'ESTUDIANTE',
      creadoEn: expect.any(Date),
    });
  });

  it('guarda la contraseña como hash bcrypt, nunca en texto plano', async () => {
    await registrar(datos);

    const guardado = await prisma.usuario.findUniqueOrThrow({ where: { email: 'ana@uni.edu' } });
    expect(guardado.passwordHash).not.toBe('secreta123');
    expect(await bcrypt.compare('secreta123', guardado.passwordHash)).toBe(true);
  });

  it('guarda el correo en minúsculas', async () => {
    const usuario = await registrar({ ...datos, email: 'Ana@Uni.EDU' });

    expect(usuario.email).toBe('ana@uni.edu');
  });

  it('rechaza un correo ya registrado sin distinguir mayúsculas (409) y no crea otra cuenta', async () => {
    await registrar({ ...datos, email: 'Ana@uni.edu' });

    const intento = registrar({ ...datos, nombre: 'Otra Ana', email: 'ana@uni.edu' });

    await expect(intento).rejects.toBeInstanceOf(AppError);
    await expect(intento).rejects.toMatchObject({ status: 409, codigo: 'CONFLICTO' });
    expect(await prisma.usuario.count()).toBe(1);
  });
});
