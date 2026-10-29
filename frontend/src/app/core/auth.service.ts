import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from './modelos';
import { Sesion, SesionService } from './sesion.service';

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);
  private readonly url = `${environment.apiUrl}/auth`;

  /** HU-01: POST /api/auth/registro */
  registrar(datos: DatosRegistro): Observable<{ usuario: Usuario }> {
    return this.http.post<{ usuario: Usuario }>(`${this.url}/registro`, datos);
  }

  /** HU-02: POST /api/auth/login. Si las credenciales son válidas, guarda la sesión. */
  iniciarSesion(credenciales: { email: string; password: string }): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.url}/login`, credenciales)
      .pipe(tap((sesion) => this.sesion.iniciar(sesion)));
  }

  cerrarSesion(): void {
    this.sesion.cerrar();
  }
}
