import { Prisma } from '@prisma/client';
import type { AppError } from '../errors/AppError';

/**
 * true si el error es una violación de una restricción UNIQUE (código P2002 de Prisma).
 * Así un duplicado se detecta en la base, incluso si dos solicitudes iguales llegan al mismo tiempo.
 */
export function esViolacionUnica(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/** true si falla una clave foránea (P2003): se referenció un registro que no existe. */
export function esClaveForaneaInexistente(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
}

/**
 * Traduce los errores de Prisma que son culpa de los datos a un AppError con su código HTTP;
 * cualquier otro error se devuelve tal cual (terminará en un 500). Uso:
 *   catch (error) { throw traducirErrorPrisma(error, { unico: AppError.conflicto('…') }); }
 */
export function traducirErrorPrisma(
  error: unknown,
  traducciones: { unico?: AppError; claveForanea?: AppError },
): unknown {
  if (traducciones.unico && esViolacionUnica(error)) return traducciones.unico;
  if (traducciones.claveForanea && esClaveForaneaInexistente(error)) return traducciones.claveForanea;
  return error;
}
