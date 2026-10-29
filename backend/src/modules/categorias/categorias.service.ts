import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

const camposPublicos = { id: true, nombre: true, creadoEn: true } as const;

/** HU-06a: cualquier visitante lista las categorías, en orden alfabético. */
export function listarCategorias() {
  return prisma.categoria.findMany({ select: camposPublicos, orderBy: { nombre: 'asc' } });
}

/** HU-06a: crea una categoría; el nombre no puede repetirse aunque cambien las mayúsculas. */
export async function crearCategoria(datos: { nombre: string }) {
  const nombreNormalizado = datos.nombre.trim().toLowerCase();
  const existente = await prisma.categoria.findUnique({ where: { nombreNormalizado } });
  if (existente) {
    throw AppError.conflicto('Ya existe una categoría con ese nombre');
  }
  return prisma.categoria.create({
    data: { nombre: datos.nombre.trim(), nombreNormalizado },
    select: camposPublicos,
  });
}
