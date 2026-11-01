import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { crearPublicacion, eliminarPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { denunciar } from '../../src/modules/reportes/reportes.service';
import { limpiarBase, prisma } from '../helpers/db';

let anaId: number;
let betoId: number;
let publicacionId: number;

beforeEach(async () => {
  await limpiarBase();
  anaId = (await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' })).id;
  betoId = (await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' })).id;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(anaId, { titulo: 'Publicación dudosa', contenido: 'Un contenido que alguien denunciará.', categoriaId })
  ).id;
});
afterAll(() => prisma.$disconnect());

describe('reportes.service · denunciar (HU-05)', () => {
  it('registra la denuncia en estado PENDIENTE con autor y publicación', async () => {
    const reporte = await denunciar(publicacionId, betoId, { motivo: 'Contenido ofensivo' });

    expect(reporte).toEqual({
      id: expect.any(Number),
      motivo: 'Contenido ofensivo',
      estado: 'PENDIENTE',
      creadoEn: expect.any(Date),
      publicacion: { id: publicacionId, titulo: 'Publicación dudosa' },
    });
    expect(await prisma.reporte.count({ where: { autorId: betoId, publicacionId } })).toBe(1);
  });

  it('denunciar dos veces la misma publicación responde 409 y no duplica', async () => {
    await denunciar(publicacionId, betoId, { motivo: 'Contenido ofensivo' });

    const intento = denunciar(publicacionId, betoId, { motivo: 'Sigue siendo ofensivo' });

    await expect(intento).rejects.toMatchObject({ status: 409, codigo: 'CONFLICTO' });
    expect(await prisma.reporte.count()).toBe(1);
  });

  it('otro usuario puede denunciar la misma publicación', async () => {
    await denunciar(publicacionId, betoId, { motivo: 'Contenido ofensivo' });

    await denunciar(publicacionId, anaId, { motivo: 'Me arrepentí de publicarlo' });

    expect(await prisma.reporte.count({ where: { publicacionId } })).toBe(2);
  });

  it('denunciar una publicación inexistente responde 404', async () => {
    await expect(denunciar(9999, betoId, { motivo: 'Contenido ofensivo' })).rejects.toMatchObject({ status: 404 });
  });

  it('al eliminar la publicación se eliminan sus denuncias (cascada)', async () => {
    await denunciar(publicacionId, betoId, { motivo: 'Contenido ofensivo' });

    await eliminarPublicacion(publicacionId, { id: anaId, rol: 'ESTUDIANTE' });

    expect(await prisma.reporte.count()).toBe(0);
  });
});
