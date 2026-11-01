import type { EstadoReporte } from '@prisma/client';
import { traducirErrorPrisma } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

const camposPublicos = {
  id: true,
  motivo: true,
  estado: true,
  creadoEn: true,
  publicacion: { select: { id: true, titulo: true } },
} as const;

/** HU-05: un usuario autenticado denuncia una publicación; queda PENDIENTE hasta que la modere un ADMIN. */
export async function denunciar(publicacionId: number, autorId: number, datos: { motivo: string }) {
  try {
    return await prisma.reporte.create({
      data: { motivo: datos.motivo, autorId, publicacionId },
      select: camposPublicos,
    });
  } catch (error) {
    throw traducirErrorPrisma(error, {
      unico: AppError.conflicto('Ya denunciaste esta publicación'),
      claveForanea: AppError.noEncontrado('Publicación'),
    });
  }
}

/** Lo que ve un administrador al moderar: además de la publicación, quién denunció. */
const camposModeracion = {
  ...camposPublicos,
  actualizadoEn: true,
  autor: { select: { id: true, nombre: true } },
} as const;

/** HU-06b: un administrador lista los reportes de un estado (por defecto PENDIENTE), más antiguos primero. */
export function listarReportes(filtro: { estado?: EstadoReporte }) {
  return prisma.reporte.findMany({
    where: { estado: filtro.estado ?? 'PENDIENTE' },
    select: camposModeracion,
    orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
  });
}

/** HU-06b: un administrador marca un reporte como RESUELTO o DESCARTADO. */
export async function cambiarEstado(id: number, datos: { estado: Exclude<EstadoReporte, 'PENDIENTE'> }) {
  try {
    return await prisma.reporte.update({ where: { id }, data: { estado: datos.estado }, select: camposModeracion });
  } catch (error) {
    throw traducirErrorPrisma(error, { inexistente: AppError.noEncontrado('Reporte') });
  }
}
