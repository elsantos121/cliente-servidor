import { Prisma } from '@prisma/client';

/**
 * true si el error es una violación de una restricción UNIQUE (código P2002 de Prisma).
 * Los servicios lo traducen a 409: así un duplicado se detecta en la base, incluso si
 * dos solicitudes iguales llegan al mismo tiempo.
 */
export function esViolacionUnica(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
