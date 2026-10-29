import { Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { z } from 'zod';
import { leerEnv } from '../../config/env';
import { esViolacionUnica } from '../../db/errores';
import { prisma } from '../../db/prisma';
import { AppError } from '../../errors/AppError';
import type { esquemaLogin, esquemaRegistro } from './auth.schemas';

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosLogin = z.infer<typeof esquemaLogin>;

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
  const passwordHash = await bcrypt.hash(datos.password, COSTO_BCRYPT);
  try {
    return await prisma.usuario.create({
      data: { nombre: datos.nombre, email, passwordHash, rol: 'ESTUDIANTE' },
      select: camposPublicosUsuario,
    });
  } catch (error) {
    if (esViolacionUnica(error)) {
      throw AppError.conflicto('El correo ya está registrado');
    }
    throw error;
  }
}

/** Lo que el token dice de quien hace la solicitud. */
export interface UsuarioToken {
  id: number;
  rol: Rol;
}

const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos';

// Hash de relleno: si el correo no existe se compara igual, para que la respuesta
// tarde lo mismo y no revele qué correos están registrados.
const HASH_RELLENO = bcrypt.hashSync('contraseña-de-relleno', COSTO_BCRYPT);

/** HU-02: valida las credenciales y devuelve un JWT con los datos públicos del usuario. */
export async function iniciarSesion(credenciales: DatosLogin) {
  const encontrado = await prisma.usuario.findUnique({
    where: { email: credenciales.email.toLowerCase() },
  });
  const coincide = await bcrypt.compare(credenciales.password, encontrado?.passwordHash ?? HASH_RELLENO);
  if (!encontrado || !coincide) {
    throw AppError.noAutenticado(MENSAJE_CREDENCIALES);
  }

  const { passwordHash: _hash, ...usuario } = encontrado;
  return { token: firmarToken(usuario), usuario };
}

/** El token guarda solo el id (sub) y el rol; expira según JWT_EXPIRES_IN. */
function firmarToken({ id, rol }: UsuarioToken): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = leerEnv();
  return jwt.sign({ rol }, JWT_SECRET, {
    subject: String(id),
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/** Verifica firma y expiración del token; cualquier problema es 401. */
export function verificarToken(token: string): UsuarioToken {
  try {
    const contenido = jwt.verify(token, leerEnv().JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof contenido === 'string') throw new Error('contenido inesperado');
    const id = Number(contenido.sub);
    const rol = contenido.rol as Rol;
    if (!Number.isInteger(id) || !Object.values(Rol).includes(rol)) throw new Error('contenido inesperado');
    return { id, rol };
  } catch {
    throw AppError.noAutenticado('Sesión inválida o expirada');
  }
}

/**
 * Crea (o actualiza) el administrador inicial. Lo usa el seed: nadie puede volverse
 * administrador desde la API. Es idempotente.
 */
export async function asegurarAdmin(datos: DatosRegistro) {
  const email = datos.email.toLowerCase();
  const passwordHash = await bcrypt.hash(datos.password, COSTO_BCRYPT);
  return prisma.usuario.upsert({
    where: { email },
    create: { nombre: datos.nombre, email, passwordHash, rol: 'ADMIN' },
    update: { nombre: datos.nombre, passwordHash, rol: 'ADMIN' },
    select: camposPublicosUsuario,
  });
}
