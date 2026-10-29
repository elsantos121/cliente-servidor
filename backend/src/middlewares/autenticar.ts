import type { Rol } from '@prisma/client';
import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { verificarToken, type UsuarioToken } from '../modules/auth/auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    /** Usuario autenticado; lo completa el middleware autenticar. */
    usuario?: UsuarioToken;
  }
}

/** Exige un header "Authorization: Bearer <token>" válido; si no, responde 401. */
export const autenticar: RequestHandler = (req, _res, next) => {
  const [esquema, token] = req.headers.authorization?.split(' ') ?? [];
  if (esquema !== 'Bearer' || !token) {
    throw AppError.noAutenticado();
  }
  req.usuario = verificarToken(token);
  next();
};

/** Exige que el usuario autenticado tenga alguno de los roles indicados; si no, responde 403. */
export function autorizar(...roles: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) {
      throw AppError.noAutenticado();
    }
    if (!roles.includes(req.usuario.rol)) {
      throw AppError.prohibido();
    }
    next();
  };
}
