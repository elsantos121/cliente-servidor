import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from './modelos';

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  /** HU-01: POST /api/auth/registro */
  registrar(datos: DatosRegistro): Observable<{ usuario: Usuario }> {
    return this.http.post<{ usuario: Usuario }>(`${this.url}/registro`, datos);
  }
}
