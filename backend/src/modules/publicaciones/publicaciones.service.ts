import { traducirErrorPrisma } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import type { UsuarioToken } from '../auth/auth.service';
import { agregarVotosPublicaciones } from '../votos/votos.service';

/** La FK de categoría falla (P2003) si la categoría no existe: es un dato inválido, no un 500. */
const categoriaInexistente = () => ({ claveForanea: AppError.validacion({ categoriaId: 'La categoría no existe' }) });

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
export async function listarPublicaciones(filtro: { categoriaId?: number }, usuarioId?: number) {
  const publicaciones = await prisma.publicacion.findMany({
    where: { categoriaId: filtro.categoriaId },
    select: camposPublicos,
    orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
  });
  return agregarVotosPublicaciones(publicaciones, usuarioId);
}

export async function obtenerPublicacion(id: number, usuarioId?: number) {
  const publicacion = await prisma.publicacion.findUnique({ where: { id }, select: camposPublicos });
  if (!publicacion) {
    throw AppError.noEncontrado('Publicación');
  }
  return (await agregarVotosPublicaciones([publicacion], usuarioId))[0];
}

/** HU-03: un usuario autenticado publica en una categoría existente. */
export async function crearPublicacion(autorId: number, datos: DatosPublicacion) {
  try {
    const publicacion = await prisma.publicacion.create({ data: { ...datos, autorId }, select: camposPublicos });
    return (await agregarVotosPublicaciones([publicacion], autorId))[0];
  } catch (error) {
    throw traducirErrorPrisma(error, categoriaInexistente());
  }
}

/** HU-03: solo el autor puede editar (ni siquiera un administrador). */
export async function editarPublicacion(id: number, usuario: UsuarioToken, datos: DatosPublicacion) {
  const { autorId } = await buscarAutor(id);
  if (autorId !== usuario.id) {
    throw AppError.prohibido('Solo el autor puede editar la publicación');
  }
  try {
    const publicacion = await prisma.publicacion.update({ where: { id }, data: datos, select: camposPublicos });
    return (await agregarVotosPublicaciones([publicacion], usuario.id))[0];
  } catch (error) {
    throw traducirErrorPrisma(error, categoriaInexistente());
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
