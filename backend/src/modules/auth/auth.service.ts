import bcrypt from 'bcryptjs';
import type { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import type { esquemaRegistro } from './auth.schemas';

export type DatosRegistro = z.infer<typeof esquemaRegistro>;

/** Campos de un usuario que se pueden mostrar: nunca incluye passwordHash. */
export const camposPublicosUsuario = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  creadoEn: true,
} as const;

const COSTO_BCRYPT = 10;

/** HU-01: crea una cuenta de ESTUDIANTE. El rol nunca se toma de los datos recibidos. */
export async function registrar(datos: DatosRegistro) {
  const email = datos.email.toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw AppError.conflicto('El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(datos.password, COSTO_BCRYPT);
  return prisma.usuario.create({
    data: { nombre: datos.nombre, email, passwordHash, rol: 'ESTUDIANTE' },
    select: camposPublicosUsuario,
  });
}
