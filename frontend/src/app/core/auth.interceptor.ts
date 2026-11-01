import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SesionService } from './sesion.service';

/**
 * HU-02: agrega "Authorization: Bearer <token>" a las solicitudes a la API.
 * Si la API responde 401 con un token enviado (expiró o es inválido), cierra la sesión y lleva al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const token = sesion.token();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const conToken = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(conToken).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        sesion.cerrar();
        void router.navigate(['/login'], { queryParams: { volver: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
