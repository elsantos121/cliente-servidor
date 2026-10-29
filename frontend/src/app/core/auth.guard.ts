import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from './modelos';
import { SesionService } from './sesion.service';

/**
 * HU-02: protege rutas del frontend. Sin sesión lleva al login (y vuelve después);
 * con un rol no permitido lleva al inicio. Es solo comodidad: el backend responde 401/403 igual.
 */
export function requiereSesion(...roles: Rol[]): CanActivateFn {
  return (_ruta, estado) => {
    const sesion = inject(SesionService);
    const router = inject(Router);

    if (!sesion.autenticado()) {
      return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
    }
    const rol = sesion.usuario()?.rol;
    if (roles.length > 0 && (!rol || !roles.includes(rol))) {
      return router.createUrlTree(['/']);
    }
    return true;
  };
}
