import { traducirErrorPrisma } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import type { UsuarioToken } from '../auth/auth.service';

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
export function listarPublicaciones(filtro: { categoriaId?: number }) {
  return prisma.publicacion.findMany({
    where: { categoriaId: filtro.categoriaId, ocultaEn: null, eliminadaEn: null },
    select: camposPublicos,
    orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
  });
}

export async function obtenerPublicacion(id: number) {
  const publicacion = await prisma.publicacion.findFirst({
    where: { id, ocultaEn: null, eliminadaEn: null },
    select: camposPublicos,
  });
  if (!publicacion) {
    throw AppError.noEncontrado('Publicación');
  }
  return publicacion;
}

export async function cambiarVisibilidadPublicacion(id: number, oculta: boolean, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const actual = await tx.publicacion.findFirst({
      where: { id, eliminadaEn: null },
      select: { id: true, titulo: true, ocultaEn: true },
    });
    if (!actual) {
      throw AppError.noEncontrado('Publicación');
    }
    if (Boolean(actual.ocultaEn) === oculta) {
      return { ...actual, oculta };
    }

    const ocultaEn = oculta ? new Date() : null;
    const actualizacion = await tx.publicacion.updateMany({
      where: { id, eliminadaEn: null, ocultaEn: actual.ocultaEn },
      data: { ocultaEn },
    });
    if (actualizacion.count === 0) {
      const actualizada = await tx.publicacion.findFirst({
        where: { id, eliminadaEn: null },
        select: { id: true, titulo: true, ocultaEn: true },
      });
      if (!actualizada) throw AppError.noEncontrado('Publicación');
      if (Boolean(actualizada.ocultaEn) !== oculta) {
        throw AppError.conflicto('La visibilidad cambió durante la operación');
      }
      return { ...actualizada, oculta };
    }

    await tx.eventoModeracion.create({
      data: {
        accion: oculta ? 'PUBLICACION_OCULTADA' : 'PUBLICACION_RESTAURADA',
        actorId,
        publicacionId: id,
      },
    });
    return { ...actual, ocultaEn, oculta };
  });
}

/** HU-03: un usuario autenticado publica en una categoría existente. */
export async function crearPublicacion(autorId: number, datos: DatosPublicacion) {
  try {
    return await prisma.publicacion.create({ data: { ...datos, autorId }, select: camposPublicos });
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
    return await prisma.publicacion.update({ where: { id }, data: datos, select: camposPublicos });
  } catch (error) {
    throw traducirErrorPrisma(error, categoriaInexistente());
  }
}

/** HU-03 / HU-06b / HU-09: el autor o ADMIN retira la publicación sin borrar su contenido. */
export async function eliminarPublicacion(id: number, usuario: UsuarioToken) {
  const { autorId } = await buscarAutor(id);
  if (autorId !== usuario.id && usuario.rol !== 'ADMIN') {
    throw AppError.prohibido('Solo el autor o un administrador pueden eliminar la publicación');
  }
  await prisma.$transaction(async (tx) => {
    const eliminacion = await tx.publicacion.updateMany({
      where: { id, eliminadaEn: null },
      data: { eliminadaEn: new Date() },
    });
    if (eliminacion.count !== 1) {
      throw AppError.noEncontrado('Publicación');
    }
    await tx.eventoModeracion.create({
      data: { accion: 'PUBLICACION_ELIMINADA', actorId: usuario.id, publicacionId: id },
    });
  });
}

async function buscarAutor(id: number) {
  const publicacion = await prisma.publicacion.findFirst({ where: { id, eliminadaEn: null }, select: { autorId: true } });
  if (!publicacion) {
    throw AppError.noEncontrado('Publicación');
  }
  return publicacion;
}
