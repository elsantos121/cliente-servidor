import type { AccionModeracion } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

export async function listarHistorial(filtro: { publicacionId?: number; accion?: AccionModeracion }) {
  if (filtro.publicacionId !== undefined) {
    const existe = await prisma.publicacion.findUnique({
      where: { id: filtro.publicacionId },
      select: { id: true },
    });
    if (!existe) {
      throw AppError.noEncontrado('Publicación');
    }
  }

  return prisma.eventoModeracion.findMany({
    where: { publicacionId: filtro.publicacionId, accion: filtro.accion },
    select: {
      id: true,
      accion: true,
      creadoEn: true,
      actor: { select: { id: true, nombre: true, rol: true } },
      publicacion: { select: { id: true, titulo: true } },
      reporte: { select: { id: true, estado: true, motivo: true } },
    },
    orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
  });
}
