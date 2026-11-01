import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Categoria } from './modelos';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  /** HU-06a: GET /api/categorias (público). */
  listar(): Observable<Categoria[]> {
    return this.http.get<{ categorias: Categoria[] }>(this.url).pipe(map((r) => r.categorias));
  }

  /** HU-06a: POST /api/categorias (solo ADMIN; el token lo agrega el interceptor). */
  crear(nombre: string): Observable<Categoria> {
    return this.http.post<{ categoria: Categoria }>(this.url, { nombre }).pipe(map((r) => r.categoria));
  }
}
