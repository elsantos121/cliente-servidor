export type Rol = 'ESTUDIANTE' | 'ADMIN';

/** Datos públicos de un usuario tal como los devuelve la API (nunca incluye la contraseña). */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  creadoEn: string;
}

/** Formato de error uniforme de la API: { error: { codigo, mensaje, detalles? } }. */
export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalles?: Record<string, string>;
}
