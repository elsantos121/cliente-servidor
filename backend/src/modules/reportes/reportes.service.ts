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
  const publicacion = await prisma.publicacion.findFirst({
    where: { id: publicacionId, ocultaEn: null, eliminadaEn: null },
    select: { id: true },
  });
  if (!publicacion) {
    throw AppError.noEncontrado('Publicación');
  }
  try {
    return await prisma.reporte.create({
      data: { motivo: datos.motivo, autorId, publicacionId },
      select: camposPublicos,
    });
  } catch (error) {
    throw traducirErrorPrisma(error, {
      unico: AppError.conflicto('Ya reportaste esta publicación'),
      claveForanea: AppError.noEncontrado('Publicación'),
    });
  }
}

/** Lo que ve un administrador al moderar: además de la publicación, quién denunció. */
const camposModeracion = {
  ...camposPublicos,
  actualizadoEn: true,
  autor: { select: { id: true, nombre: true } },
  publicacion: { select: { id: true, titulo: true, ocultaEn: true } },
} as const;

/** HU-06b: un administrador lista los reportes de un estado (por defecto PENDIENTE), más antiguos primero. */
export function listarReportes(filtro: { estado?: EstadoReporte }) {
  return prisma.reporte.findMany({
    where: { estado: filtro.estado ?? 'PENDIENTE', publicacion: { eliminadaEn: null } },
    select: camposModeracion,
    orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
  });
}

/** HU-06b / HU-09: cambia el estado y registra el evento de auditoría en la misma transacción. */
export async function cambiarEstado(id: number, datos: { estado: Exclude<EstadoReporte, 'PENDIENTE'> }, actorId: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const actualizacion = await tx.reporte.updateMany({
        where: { id, estado: { not: datos.estado } },
        data: { estado: datos.estado },
      });
      if (actualizacion.count === 0) {
        const actual = await tx.reporte.findUnique({ where: { id }, select: camposModeracion });
        if (!actual) throw AppError.noEncontrado('Reporte');
        return actual;
      }

      const reporte = await tx.reporte.findUniqueOrThrow({ where: { id }, select: camposModeracion });
      await tx.eventoModeracion.create({
        data: {
          accion: datos.estado === 'RESUELTO' ? 'REPORTE_RESUELTO' : 'REPORTE_DESCARTADO',
          actorId,
          publicacionId: reporte.publicacion.id,
          reporteId: reporte.id,
        },
      });
      return reporte;
    });
  } catch (error) {
    throw traducirErrorPrisma(error, { inexistente: AppError.noEncontrado('Reporte') });
  }
}
