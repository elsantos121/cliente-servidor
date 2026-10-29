import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { limpiarBase, prisma } from '../helpers/db';

// Dos solicitudes iguales al mismo tiempo: una gana y la otra recibe 409 (no un error 500).
describe('duplicados que llegan al mismo tiempo', () => {
  beforeEach(limpiarBase);
  afterAll(() => prisma.$disconnect());

  it('registro (HU-01): un 201 y un 409', async () => {
    const datos = { nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' };

    const resultados = await Promise.allSettled([registrar(datos), registrar(datos)]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.find((r) => r.status === 'rejected')).toMatchObject({ reason: { status: 409 } });
  });

  it('categorías (HU-06a): un 201 y un 409', async () => {
    const resultados = await Promise.allSettled([
      crearCategoria({ nombre: 'Física' }),
      crearCategoria({ nombre: 'física' }),
    ]);

    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.find((r) => r.status === 'rejected')).toMatchObject({ reason: { status: 409 } });
  });
});
