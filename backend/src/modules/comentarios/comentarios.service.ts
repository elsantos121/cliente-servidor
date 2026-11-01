import { traducirErrorPrisma } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

const camposPublicos = {
  id: true,
  contenido: true,
  creadoEn: true,
  autor: { select: { id: true, nombre: true } },
} as const;

/** HU-04: cualquier visitante lista los comentarios de una publicación, los más antiguos primero. */
export async function listarComentarios(publicacionId: number) {
  const existe = await prisma.publicacion.count({ where: { id: publicacionId } });
  if (!existe) {
    throw AppError.noEncontrado('Publicación');
  }
  return prisma.comentario.findMany({
    where: { publicacionId },
    select: camposPublicos,
    orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
  });
}

/** HU-04: un usuario autenticado comenta; si la publicación no existe (FK), 404. */
export async function comentar(publicacionId: number, autorId: number, datos: { contenido: string }) {
  try {
    return await prisma.comentario.create({
      data: { contenido: datos.contenido, autorId, publicacionId },
      select: camposPublicos,
    });
  } catch (error) {
    throw traducirErrorPrisma(error, { claveForanea: AppError.noEncontrado('Publicación') });
  }
}
