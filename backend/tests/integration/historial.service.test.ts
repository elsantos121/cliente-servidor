import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { asegurarAdmin, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { comentar } from '../../src/modules/comentarios/comentarios.service';
import { eliminarPublicacion, crearPublicacion, cambiarVisibilidadPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { cambiarEstado, denunciar } from '../../src/modules/reportes/reportes.service';
import { listarHistorial } from '../../src/modules/moderacion/moderacion.service';
import { limpiarBase, prisma } from '../helpers/db';

let adminId: number;
let betoId: number;
let publicacionId: number;
let reporteId: number;

beforeEach(async () => {
  await limpiarBase();
  const ana = await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' });
  const beto = await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' });
  adminId = (await asegurarAdmin({ nombre: 'Admin', email: 'admin@uni.edu', password: 'admin12345' })).id;
  betoId = beto.id;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(ana.id, {
      titulo: 'Publicación dudosa',
      contenido: 'Un contenido que alguien denunciará.',
      categoriaId,
    })
  ).id;
  reporteId = (await denunciar(publicacionId, betoId, { motivo: 'Contenido ofensivo' })).id;
});

afterAll(() => prisma.$disconnect());

describe('moderacion.service · historial (HU-09)', () => {
  it('registra actor, recursos, acciones y fecha en orden más reciente primero', async () => {
    await cambiarVisibilidadPublicacion(publicacionId, true, adminId);
    await cambiarVisibilidadPublicacion(publicacionId, false, adminId);
    await cambiarEstado(reporteId, { estado: 'DESCARTADO' }, adminId);
    await comentar(publicacionId, betoId, { contenido: 'La publicación tiene contexto importante.' });
    await eliminarPublicacion(publicacionId, { id: adminId, rol: 'ADMIN' });

    const eventos = await listarHistorial({ publicacionId });

    expect(eventos.map(({ accion }) => accion)).toEqual([
      'PUBLICACION_ELIMINADA',
      'REPORTE_DESCARTADO',
      'PUBLICACION_RESTAURADA',
      'PUBLICACION_OCULTADA',
    ]);
    expect(eventos[0]).toMatchObject({
      actor: { id: adminId, nombre: 'Admin', rol: 'ADMIN' },
      publicacion: { id: publicacionId, titulo: 'Publicación dudosa' },
    });
    expect(eventos[1].reporte).toMatchObject({ id: reporteId, estado: 'DESCARTADO' });
    expect(eventos.every(({ creadoEn }) => creadoEn instanceof Date)).toBe(true);
  });

  it('filtra por acción, rechaza una publicación inexistente y conserva los datos al eliminar', async () => {
    await comentar(publicacionId, betoId, { contenido: 'La publicación tiene contexto importante.' });
    await cambiarVisibilidadPublicacion(publicacionId, true, adminId);
    await eliminarPublicacion(publicacionId, { id: adminId, rol: 'ADMIN' });

    const eventos = await listarHistorial({ publicacionId, accion: 'PUBLICACION_ELIMINADA' });

    expect(eventos).toHaveLength(1);
    expect(await prisma.publicacion.count({ where: { id: publicacionId, eliminadaEn: { not: null } } })).toBe(1);
    expect(await prisma.comentario.count({ where: { publicacionId } })).toBe(1);
    expect(await prisma.reporte.count({ where: { id: reporteId } })).toBe(1);
    await expect(listarHistorial({ publicacionId: 9999 })).rejects.toMatchObject({ status: 404 });
  });

  it('repetir el mismo estado de reporte no agrega otro evento', async () => {
    await cambiarEstado(reporteId, { estado: 'RESUELTO' }, adminId);
    await cambiarEstado(reporteId, { estado: 'RESUELTO' }, adminId);

    const eventos = await listarHistorial({ publicacionId, accion: 'REPORTE_RESUELTO' });

    expect(eventos).toHaveLength(1);
  });

  it('repetir la misma visibilidad no agrega otro evento', async () => {
    await cambiarVisibilidadPublicacion(publicacionId, true, adminId);
    await cambiarVisibilidadPublicacion(publicacionId, true, adminId);

    const eventos = await listarHistorial({ publicacionId, accion: 'PUBLICACION_OCULTADA' });

    expect(eventos).toHaveLength(1);
  });

  it('no permite modificar ni borrar eventos de auditoría', async () => {
    await cambiarVisibilidadPublicacion(publicacionId, true, adminId);
    const [evento] = await listarHistorial({ publicacionId });

    await expect(
      prisma.eventoModeracion.update({ where: { id: evento.id }, data: { accion: 'PUBLICACION_RESTAURADA' } }),
    ).rejects.toThrow();
    await expect(prisma.eventoModeracion.delete({ where: { id: evento.id } })).rejects.toThrow();
  });
});
