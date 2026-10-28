import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

export async function registrar(datos: DatosRegistro) {
  const email = datos.email.toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw AppError.conflicto('El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(datos.password, 10);
  return prisma.usuario.create({
    data: { nombre: datos.nombre, email, passwordHash },
    select: { id: true, nombre: true, email: true, rol: true, creadoEn: true },
  });
}
