import { Injectable, computed, signal } from '@angular/core';
import { Usuario } from './modelos';

export interface Sesion {
  token: string;
  usuario: Usuario;
}

const CLAVE = 'foro.sesion';

/**
 * Estado de la sesión (HU-02): token JWT y usuario. Se guarda en localStorage para
 * sobrevivir a recargas. Es solo comodidad del frontend: los permisos se verifican en el backend.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly sesion = signal<Sesion | null>(leerGuardada());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');

  iniciar(sesion: Sesion): void {
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento disponible la sesión dura hasta recargar la página.
    }
  }

  cerrar(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      // Nada que borrar.
    }
  }
}

/** Recupera la sesión guardada si existe y su token no expiró. */
function leerGuardada(): Sesion | null {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
    if (!guardada?.token || !guardada.usuario || tokenExpirado(guardada.token)) {
      localStorage.removeItem(CLAVE);
      return null;
    }
    return guardada;
  } catch {
    return null;
  }
}

/** Lee el vencimiento (exp) del JWT. No verifica la firma: eso lo hace el backend. */
export function tokenExpirado(token: string, ahoraMs = Date.now()): boolean {
  try {
    const contenido = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof contenido.exp !== 'number' || contenido.exp * 1000 <= ahoraMs;
  } catch {
    return true;
  }
}
