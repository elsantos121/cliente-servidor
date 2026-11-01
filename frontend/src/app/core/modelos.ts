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

export interface Categoria {
  id: number;
  nombre: string;
  creadoEn: string;
}

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  creadoEn: string;
  actualizadoEn: string;
  autor: { id: number; nombre: string };
  categoria: { id: number; nombre: string };
}

export interface DatosPublicacion {
  titulo: string;
  contenido: string;
  categoriaId: number;
}

export interface Comentario {
  id: number;
  contenido: string;
  creadoEn: string;
  autor: { id: number; nombre: string };
}
