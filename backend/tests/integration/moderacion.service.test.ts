import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { crearPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { cambiarEstado, denunciar, listarReportes } from '../../src/modules/reportes/reportes.service';
import { limpiarBase, prisma } from '../helpers/db';

let anaId: number;
let betoId: number;
let primeraId: number;
let segundaId: number;

beforeEach(async () => {
  await limpiarBase();
  anaId = (await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' })).id;
  betoId = (await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' })).id;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  const contenido = 'Un contenido que alguien denunciará.';
  primeraId = (await crearPublicacion(anaId, { titulo: 'Primera', contenido, categoriaId })).id;
  segundaId = (await crearPublicacion(anaId, { titulo: 'Segunda', contenido, categoriaId })).id;
});
afterAll(() => prisma.$disconnect());

describe('reportes.service · listarReportes (HU-06b)', () => {
  it('por defecto lista los PENDIENTE, más antiguos primero, con publicación, autor y motivo', async () => {
    await denunciar(primeraId, betoId, { motivo: 'Contenido ofensivo' });
    await denunciar(segundaId, betoId, { motivo: 'Es spam evidente' });

    const reportes = await listarReportes({});

    expect(reportes).toEqual([
      {
        id: expect.any(Number),
        motivo: 'Contenido ofensivo',
        estado: 'PENDIENTE',
        creadoEn: expect.any(Date),
        actualizadoEn: expect.any(Date),
        publicacion: { id: primeraId, titulo: 'Primera' },
        autor: { id: betoId, nombre: 'Beto' },
      },
      expect.objectContaining({ motivo: 'Es spam evidente', publicacion: { id: segundaId, titulo: 'Segunda' } }),
    ]);
  });

  it('filtra por estado', async () => {
    const { id } = await denunciar(primeraId, betoId, { motivo: 'Contenido ofensivo' });
    await denunciar(segundaId, betoId, { motivo: 'Es spam evidente' });
    await cambiarEstado(id, { estado: 'DESCARTADO' });

    expect((await listarReportes({ estado: 'DESCARTADO' })).map((r) => r.motivo)).toEqual(['Contenido ofensivo']);
    expect((await listarReportes({ estado: 'PENDIENTE' })).map((r) => r.motivo)).toEqual(['Es spam evidente']);
  });
});

describe('reportes.service · cambiarEstado (HU-06b)', () => {
  it.each(['RESUELTO', 'DESCARTADO'] as const)('cambia el estado a %s', async (estado) => {
    const { id } = await denunciar(primeraId, betoId, { motivo: 'Contenido ofensivo' });

    const reporte = await cambiarEstado(id, { estado });

    expect(reporte).toMatchObject({ id, estado });
    expect((await prisma.reporte.findUniqueOrThrow({ where: { id } })).estado).toBe(estado);
  });

  it('un reporte inexistente responde 404', async () => {
    await expect(cambiarEstado(9999, { estado: 'RESUELTO' })).rejects.toMatchObject({ status: 404 });
  });
});
