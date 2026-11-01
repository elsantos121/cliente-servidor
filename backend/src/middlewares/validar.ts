import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Valida datos con un esquema Zod y devuelve los datos ya limpios; si no son válidos,
 * lanza un 400 con un mensaje por campo. Sirve también para req.query, que en Express 5
 * no se puede reemplazar desde un middleware.
 */
export function parsear<T extends z.ZodType>(esquema: T, datos: unknown): z.infer<T> {
  const resultado = esquema.safeParse(datos ?? {});
  if (!resultado.success) {
    const detalles: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path.join('.') || 'cuerpo';
      detalles[campo] ??= problema.message;
    }
    throw AppError.validacion(detalles);
  }
  return resultado.data;
}

/** Valida req.body y lo reemplaza por los datos limpios (sin campos desconocidos). */
export function validar(esquema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = parsear(esquema, req.body);
    next();
  };
}

/** Lee un :id de la ruta. Un id que no es un entero positivo no puede existir: 404. */
export function idDeRuta(valor: string | string[] | undefined, recurso: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.noEncontrado(recurso);
  }
  return id;
}
