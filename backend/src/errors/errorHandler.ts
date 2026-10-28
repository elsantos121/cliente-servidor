import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './AppError';

/** Responde 404 para cualquier ruta que ningún módulo atendió. */
export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'RUTA_NO_ENCONTRADA', `No existe la ruta ${req.method} ${req.path}`));
};

/**
 * Manejador centralizado de errores. Express 5 envía aquí también los errores
 * de funciones async, por lo que los controladores no necesitan try/catch.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { codigo: err.codigo, mensaje: err.message, detalles: err.detalles },
    });
    return;
  }

  // JSON mal formado en el cuerpo de la solicitud
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es un JSON válido' } });
    return;
  }

  // Error inesperado: se registra en el servidor pero no se exponen detalles internos al cliente.
  console.error(err);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' } });
};
