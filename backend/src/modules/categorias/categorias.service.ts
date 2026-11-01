import { esViolacionUnica } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

const camposPublicos = { id: true, nombre: true, creadoEn: true } as const;

/** HU-06a: cualquier visitante lista las categorías, en orden alfabético. */
export function listarCategorias() {
  return prisma.categoria.findMany({ select: camposPublicos, orderBy: { nombre: 'asc' } });
}

/** HU-06a: crea una categoría; el nombre no puede repetirse aunque cambien las mayúsculas. */
export async function crearCategoria(datos: { nombre: string }) {
  const nombre = datos.nombre.trim();
  try {
    return await prisma.categoria.create({
      data: { nombre, nombreNormalizado: nombre.toLowerCase() },
      select: camposPublicos,
    });
  } catch (error) {
    if (esViolacionUnica(error)) {
      throw AppError.conflicto('Ya existe una categoría con ese nombre');
    }
    throw error;
  }
}
