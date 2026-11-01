import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { comentar, listarComentarios } from '../../src/modules/comentarios/comentarios.service';
import { crearPublicacion, eliminarPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
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
    await crearPublicacion(anaId, { titulo: 'Ayuda con límites', contenido: 'No entiendo el ejercicio 3.', categoriaId })
  ).id;
});
afterAll(() => prisma.$disconnect());

describe('comentarios.service (HU-04)', () => {
  it('crea un comentario asociado al autor y a la publicación', async () => {
    const comentario = await comentar(publicacionId, betoId, { contenido: 'Probá con L’Hôpital' });

    expect(comentario).toEqual({
      id: expect.any(Number),
      contenido: 'Probá con L’Hôpital',
      creadoEn: expect.any(Date),
      autor: { id: betoId, nombre: 'Beto' },
    });
    expect(await prisma.comentario.count({ where: { publicacionId, autorId: betoId } })).toBe(1);
  });

  it('comentar una publicación inexistente responde 404', async () => {
    await expect(comentar(9999, betoId, { contenido: 'Hola' })).rejects.toMatchObject({ status: 404 });
  });

  it('lista los comentarios de la publicación, los más antiguos primero, con el nombre del autor', async () => {
    await comentar(publicacionId, betoId, { contenido: 'Primero' });
    await comentar(publicacionId, anaId, { contenido: 'Segundo' });

    const comentarios = await listarComentarios(publicacionId);

    expect(comentarios.map((c) => [c.contenido, c.autor.nombre])).toEqual([
      ['Primero', 'Beto'],
      ['Segundo', 'Ana'],
    ]);
  });

  it('listar comentarios de una publicación inexistente responde 404', async () => {
    await expect(listarComentarios(9999)).rejects.toMatchObject({ status: 404 });
  });

  it('una publicación sin comentarios devuelve una lista vacía', async () => {
    expect(await listarComentarios(publicacionId)).toEqual([]);
  });

  it('al eliminar la publicación se eliminan sus comentarios (cascada)', async () => {
    await comentar(publicacionId, betoId, { contenido: 'Se va a borrar' });

    await eliminarPublicacion(publicacionId, { id: anaId, rol: 'ESTUDIANTE' });

    expect(await prisma.comentario.count()).toBe(0);
  });
});
