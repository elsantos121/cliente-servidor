import { PrismaClient } from '@prisma/client';

/** Cliente de Prisma compartido por toda la aplicación (una sola conexión al pool). */
export const prisma = new PrismaClient();
