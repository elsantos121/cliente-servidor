/**
 * Error de aplicación con código HTTP. Los servicios lanzan AppError y el manejador
 * centralizado (errorHandler) lo convierte en una respuesta JSON uniforme.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles?: Record<string, string>,
  ) {
    super(mensaje);
    this.name = 'AppError';
  }

  static validacion(detalles: Record<string, string>) {
    return new AppError(400, 'VALIDACION', 'Datos inválidos', detalles);
  }

  static noAutenticado(mensaje = 'Se requiere iniciar sesión') {
    return new AppError(401, 'NO_AUTENTICADO', mensaje);
  }

  static prohibido(mensaje = 'No tiene permiso para realizar esta operación') {
    return new AppError(403, 'PROHIBIDO', mensaje);
  }

  static noEncontrado(recurso: string) {
    return new AppError(404, 'NO_ENCONTRADO', `${recurso} no encontrado`);
  }

  static conflicto(mensaje: string) {
    return new AppError(409, 'CONFLICTO', mensaje);
  }
}
