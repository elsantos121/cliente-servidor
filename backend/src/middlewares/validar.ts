import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Valida req.body con un esquema Zod. Si es válido, lo reemplaza por los datos ya
 * limpios (sin campos desconocidos); si no, responde 400 con un mensaje por campo.
 */
export function validar(esquema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const detalles: Record<string, string> = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path.join('.') || 'cuerpo';
        detalles[campo] ??= problema.message;
      }
      throw AppError.validacion(detalles);
    }
    req.body = resultado.data;
    next();
  };
}
