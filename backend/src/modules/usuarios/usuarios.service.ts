import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import { camposPublicosUsuario } from '../auth/auth.service';

/** HU-02: datos públicos del usuario de la sesión. Si la cuenta ya no existe, la sesión no es válida. */
export async function obtenerUsuarioActual(id: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: camposPublicosUsuario });
  if (!usuario) {
    throw AppError.noAutenticado('Sesión inválida o expirada');
  }
  return usuario;
}
