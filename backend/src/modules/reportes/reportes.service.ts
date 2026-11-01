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
