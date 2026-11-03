import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { crearPublicacion, listarPublicaciones } from '../../src/modules/publicaciones/publicaciones.service';
import { comentar, listarComentarios } from '../../src/modules/comentarios/comentarios.service';
import {
  quitarVotoComentario,
  quitarVotoPublicacion,
  votarComentario,
  votarPublicacion,
} from '../../src/modules/votos/votos.service';
import { limpiarBase, prisma } from '../helpers/db';

let anaId: number;
let betoId: number;
let publicacionId: number;
let comentarioId: number;

beforeEach(async () => {
  await limpiarBase();
  anaId = (await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' })).id;
  betoId = (await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' })).id;
  const categoriaId = (await crearCategoria({ nombre: 'Matemática' })).id;
  publicacionId = (
    await crearPublicacion(anaId, {
      titulo: 'Ayuda con límites',
      contenido: 'Necesito ayuda con el ejercicio 3 del práctico.',
      categoriaId,
    })
  ).id;
  comentarioId = (
    await comentar(publicacionId, anaId, { contenido: 'Probá con L’Hôpital.' })
  ).id;
});

afterAll(() => prisma.$disconnect());

describe('votos.service · publicaciones y comentarios (HU-07)', () => {
  it('un usuario puede votar y cambiar su voto en una publicación sin duplicarlo', async () => {
    await votarPublicacion(publicacionId, betoId, 'POSITIVO');
    await votarPublicacion(publicacionId, betoId, 'NEGATIVO');

    expect(await prisma.votoPublicacion.count({ where: { publicacionId, usuarioId: betoId } })).toBe(1);
    expect((await listarPublicaciones({}, betoId))[0].votos).toEqual({ positivos: 0, negativos: 1, miVoto: 'NEGATIVO' });
  });

  it('dos solicitudes concurrentes conservan un solo voto por usuario y publicación', async () => {
    await Promise.all([
      votarPublicacion(publicacionId, betoId, 'POSITIVO'),
      votarPublicacion(publicacionId, betoId, 'NEGATIVO'),
    ]);

    expect(await prisma.votoPublicacion.count({ where: { publicacionId, usuarioId: betoId } })).toBe(1);
    const resumen = (await listarPublicaciones({}, betoId))[0].votos;
    expect(resumen.positivos + resumen.negativos).toBe(1);
  });

  it('el autor no puede votar su propia publicación', async () => {
    await expect(votarPublicacion(publicacionId, anaId, 'POSITIVO')).rejects.toMatchObject({ status: 403 });
  });

  it('elimina el voto de una publicación y permite repetir la eliminación', async () => {
    await votarPublicacion(publicacionId, betoId, 'POSITIVO');

    await quitarVotoPublicacion(publicacionId, betoId);
    await quitarVotoPublicacion(publicacionId, betoId);

    expect(await prisma.votoPublicacion.count({ where: { publicacionId, usuarioId: betoId } })).toBe(0);
  });

  it('vota un comentario, muestra el conteo y elimina el voto', async () => {
    await votarComentario(comentarioId, betoId, 'POSITIVO');

    expect((await listarComentarios(publicacionId))[0].votos).toEqual({ positivos: 1, negativos: 0, miVoto: null });

    await quitarVotoComentario(comentarioId, betoId);

    expect(await prisma.votoComentario.count({ where: { comentarioId, usuarioId: betoId } })).toBe(0);
  });

  it('el autor no puede votar su propio comentario', async () => {
    await expect(votarComentario(comentarioId, anaId, 'NEGATIVO')).rejects.toMatchObject({ status: 403 });
  });

  it('un comentario inexistente responde 404', async () => {
    await expect(votarComentario(9999, betoId, 'POSITIVO')).rejects.toMatchObject({ status: 404 });
  });
});
