import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { crearCategoria, listarCategorias } from '../../src/modules/categorias/categorias.service';
import { limpiarBase, prisma } from '../helpers/db';

describe('categorias.service (HU-06a)', () => {
  beforeEach(limpiarBase);
  afterAll(() => prisma.$disconnect());

  it('crea una categoría y devuelve id, nombre y fecha', async () => {
    const categoria = await crearCategoria({ nombre: 'Matemática' });

    expect(categoria).toEqual({ id: expect.any(Number), nombre: 'Matemática', creadoEn: expect.any(Date) });
  });

  it('rechaza un nombre repetido sin distinguir mayúsculas (409)', async () => {
    await crearCategoria({ nombre: 'Matemática' });

    const intento = crearCategoria({ nombre: 'MATEMÁTICA' });

    await expect(intento).rejects.toMatchObject({ status: 409, codigo: 'CONFLICTO' });
    expect(await prisma.categoria.count()).toBe(1);
  });

  it('lista las categorías en orden alfabético', async () => {
    await crearCategoria({ nombre: 'Programación' });
    await crearCategoria({ nombre: 'Física' });
    await crearCategoria({ nombre: 'Matemática' });

    const categorias = await listarCategorias();

    expect(categorias.map((c) => c.nombre)).toEqual(['Física', 'Matemática', 'Programación']);
  });

  it('sin categorías devuelve una lista vacía', async () => {
    expect(await listarCategorias()).toEqual([]);
  });
});
