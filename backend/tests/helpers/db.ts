import { prisma } from '../../src/db/prisma';

/**
 * Vacía las tablas del foro en la base de pruebas para que cada prueba empiece de cero.
 * Al agregar un modelo nuevo, sumar su tabla a la lista.
 */
export async function limpiarBase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE usuarios, categorias RESTART IDENTITY CASCADE');
}

export { prisma };
