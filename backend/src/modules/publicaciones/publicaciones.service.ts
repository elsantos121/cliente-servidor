import { esClaveForaneaInexistente } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import type { UsuarioToken } from '../auth/auth.service';

export interface DatosPublicacion {
  titulo: string;
  contenido: string;
  categoriaId: number;
}

/** Lo que se muestra de una publicación: autor y categoría solo con id y nombre. */
const camposPublicos = {
  id: true,
  titulo: true,
  contenido: true,
  creadoEn: true,
  actualizadoEn: true,
  autor: { select: { id: true, nombre: true } },
  categoria: { select: { id: true, nombre: true } },
} as const;

/** HU-03: cualquier visitante lista publicaciones, las más recientes primero. */
export function listarPublicaciones(filtro: { categoriaId?: number }) {
  return prisma.publicacion.findMany({
    where: { categoriaId: filtro.categoriaId },
    select: camposPublicos,
    orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
  });
}

export async function obtenerPublicacion(id: number) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id }, select: camposPublicos });
  if (!publicacion) {
    throw AppError.noEncontrado('Publicación');
  }
  return publicacion;
}

/** HU-03: un usuario autenticado publica en una categoría existente. */
export async function crearPublicacion(autorId: number, datos: DatosPublicacion) {
  try {
    return await prisma.publicacion.create({ data: { ...datos, autorId }, select: camposPublicos });
  } catch (error) {
    throw traducirCategoriaInexistente(error);
  }
}

/** HU-03: solo el autor puede editar (ni siquiera un administrador). */
export async function editarPublicacion(id: number, usuario: UsuarioToken, datos: DatosPublicacion) {
  const { autorId } = await buscarAutor(id);
  if (autorId !== usuario.id) {
    throw AppError.prohibido('Solo el autor puede editar la publicación');
  }
  try {
    return await prisma.publicacion.update({ where: { id }, data: datos, select: camposPublicos });
  } catch (error) {
    throw traducirCategoriaInexistente(error);
  }
}

/** HU-03 / HU-06b: puede eliminar el autor o un administrador. */
export async function eliminarPublicacion(id: number, usuario: UsuarioToken) {
  const { autorId } = await buscarAutor(id);
  if (autorId !== usuario.id && usuario.rol !== 'ADMIN') {
    throw AppError.prohibido('Solo el autor o un administrador pueden eliminar la publicación');
  }
  await prisma.publicacion.delete({ where: { id } });
}

async function buscarAutor(id: number) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id }, select: { autorId: true } });
  if (!publicacion) {
    throw AppError.noEncontrado('Publicación');
  }
  return publicacion;
}

/** La FK de categoría falla (P2003) si la categoría no existe: es un dato inválido, no un 500. */
function traducirCategoriaInexistente(error: unknown): unknown {
  if (esClaveForaneaInexistente(error)) {
    return AppError.validacion({ categoriaId: 'La categoría no existe' });
  }
  return error;
}
