import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { UsuarioToken } from '../../src/modules/auth/auth.service';
import { asegurarAdmin, registrar } from '../../src/modules/auth/auth.service';
import { crearCategoria } from '../../src/modules/categorias/categorias.service';
import {
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  listarPublicaciones,
  obtenerPublicacion,
} from '../../src/modules/publicaciones/publicaciones.service';
import { limpiarBase, prisma } from '../helpers/db';

let ana: UsuarioToken;
let beto: UsuarioToken;
let admin: UsuarioToken;
let matematica: number;
let programacion: number;

const datos = (categoriaId: number, titulo = 'Ayuda con límites') => ({
  titulo,
  contenido: 'Necesito ayuda con el ejercicio 3 del práctico.',
  categoriaId,
});

beforeEach(async () => {
  await limpiarBase();
  const a = await registrar({ nombre: 'Ana', email: 'ana@uni.edu', password: 'secreta123' });
  const b = await registrar({ nombre: 'Beto', email: 'beto@uni.edu', password: 'secreta123' });
  const ad = await asegurarAdmin({ nombre: 'Admin', email: 'admin@uni.edu', password: 'admin12345' });
  ana = { id: a.id, rol: a.rol };
  beto = { id: b.id, rol: b.rol };
  admin = { id: ad.id, rol: ad.rol };
  matematica = (await crearCategoria({ nombre: 'Matemática' })).id;
  programacion = (await crearCategoria({ nombre: 'Programación' })).id;
});
afterAll(() => prisma.$disconnect());

describe('publicaciones.service · crear y consultar (HU-03)', () => {
  it('crea una publicación con autor y categoría', async () => {
    const publicacion = await crearPublicacion(ana.id, datos(matematica));

    expect(publicacion).toMatchObject({
      id: expect.any(Number),
      titulo: 'Ayuda con límites',
      autor: { id: ana.id, nombre: 'Ana' },
      categoria: { id: matematica, nombre: 'Matemática' },
    });
  });

  it('con una categoría inexistente responde 400 en el campo categoriaId', async () => {
    const intento = crearPublicacion(ana.id, datos(9999));

    await expect(intento).rejects.toMatchObject({ status: 400, detalles: { categoriaId: expect.any(String) } });
  });

  it('lista las más recientes primero y filtra por categoría', async () => {
    await crearPublicacion(ana.id, datos(matematica, 'Primera'));
    await crearPublicacion(beto.id, datos(programacion, 'Segunda'));
    await crearPublicacion(ana.id, datos(matematica, 'Tercera'));

    const todas = await listarPublicaciones({});
    const deMatematica = await listarPublicaciones({ categoriaId: matematica });

    expect(todas.map((p) => p.titulo)).toEqual(['Tercera', 'Segunda', 'Primera']);
    expect(deMatematica.map((p) => p.titulo)).toEqual(['Tercera', 'Primera']);
  });

  it('obtiene el detalle por id', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    expect(await obtenerPublicacion(id)).toMatchObject({ id, titulo: 'Ayuda con límites' });
  });

  it('un id inexistente responde 404', async () => {
    await expect(obtenerPublicacion(9999)).rejects.toMatchObject({ status: 404 });
  });
});

describe('publicaciones.service · editar y eliminar (HU-03)', () => {
  it('el autor edita su publicación', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    const editada = await editarPublicacion(id, ana, datos(programacion, 'Título nuevo'));

    expect(editada).toMatchObject({ titulo: 'Título nuevo', categoria: { id: programacion } });
  });

  it('otro estudiante no puede editarla (403)', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    await expect(editarPublicacion(id, beto, datos(matematica, 'Ajena'))).rejects.toMatchObject({ status: 403 });
  });

  it('ni siquiera un administrador puede editar una publicación ajena (403)', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    await expect(editarPublicacion(id, admin, datos(matematica, 'Ajena'))).rejects.toMatchObject({ status: 403 });
  });

  it('editar con una categoría inexistente responde 400', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    await expect(editarPublicacion(id, ana, datos(9999))).rejects.toMatchObject({ status: 400 });
  });

  it('editar una publicación inexistente responde 404', async () => {
    await expect(editarPublicacion(9999, ana, datos(matematica))).rejects.toMatchObject({ status: 404 });
  });

  it('el autor elimina su publicación', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    await eliminarPublicacion(id, ana);

    expect(await prisma.publicacion.count()).toBe(0);
  });

  it('un administrador elimina una publicación ajena', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    await eliminarPublicacion(id, admin);

    expect(await prisma.publicacion.count()).toBe(0);
  });

  it('otro estudiante no puede eliminarla (403)', async () => {
    const { id } = await crearPublicacion(ana.id, datos(matematica));

    await expect(eliminarPublicacion(id, beto)).rejects.toMatchObject({ status: 403 });
    expect(await prisma.publicacion.count()).toBe(1);
  });

  it('eliminar una publicación inexistente responde 404', async () => {
    await expect(eliminarPublicacion(9999, ana)).rejects.toMatchObject({ status: 404 });
  });
});
