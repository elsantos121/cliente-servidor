import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import { comentar, listarComentarios } from '../../src/modules/comentarios/comentarios.service';
import { crearPublicacion, listarPublicaciones, obtenerPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
import { denunciar } from '../../src/modules/reportes/reportes.service';
import { cambiarVisibilidadPublicacion } from '../../src/modules/publicaciones/publicaciones.service';
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
    await crearPublicacion(anaId, {
      titulo: 'Ayuda con límites',
      contenido: 'Necesito ayuda con el ejercicio 3 del práctico.',
      categoriaId,
    })
  ).id;
});

afterAll(() => prisma.$disconnect());

describe('ocultamiento.service (HU-08)', () => {
  it('oculta una publicación de listados y detalles públicos', async () => {
    await cambiarVisibilidadPublicacion(publicacionId, true);

    expect(await listarPublicaciones({})).toEqual([]);
    await expect(obtenerPublicacion(publicacionId)).rejects.toMatchObject({ status: 404 });
  });

  it('restaura una publicación y permite volver a consultarla', async () => {
    await cambiarVisibilidadPublicacion(publicacionId, true);
    const restaurada = await cambiarVisibilidadPublicacion(publicacionId, false);

    expect(restaurada.ocultaEn).toBeNull();
    expect(await obtenerPublicacion(publicacionId)).toMatchObject({ id: publicacionId });
  });

  it('repetir el estado actual no altera el resultado', async () => {
    const primera = await cambiarVisibilidadPublicacion(publicacionId, true);
    const segunda = await cambiarVisibilidadPublicacion(publicacionId, true);

    expect(primera.ocultaEn).toBeInstanceOf(Date);
    expect(segunda.ocultaEn).toEqual(primera.ocultaEn);
  });

  it('ocultar o restaurar una publicación inexistente responde 404', async () => {
    await expect(cambiarVisibilidadPublicacion(9999, true)).rejects.toMatchObject({ status: 404 });
  });

  it('una publicación oculta no admite comentarios ni nuevas denuncias', async () => {
    await cambiarVisibilidadPublicacion(publicacionId, true);

    await expect(comentar(publicacionId, betoId, { contenido: 'No debería entrar' })).rejects.toMatchObject({
      status: 404,
    });
    await expect(listarComentarios(publicacionId)).rejects.toMatchObject({ status: 404 });
    await expect(denunciar(publicacionId, betoId, { motivo: 'Contenido ofensivo' })).rejects.toMatchObject({
      status: 404,
    });
  });
});
