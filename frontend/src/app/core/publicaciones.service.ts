import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosPublicacion, Publicacion } from './modelos';

/** HU-03: publicaciones. El token de las operaciones protegidas lo agrega el interceptor. */
@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/publicaciones`;

  listar(categoriaId?: number): Observable<Publicacion[]> {
    const params = categoriaId ? new HttpParams().set('categoriaId', categoriaId) : undefined;
    return this.http
      .get<{ publicaciones: Publicacion[] }>(this.url, { params })
      .pipe(map((r) => r.publicaciones));
  }

  obtener(id: number): Observable<Publicacion> {
    return this.http.get<{ publicacion: Publicacion }>(`${this.url}/${id}`).pipe(map((r) => r.publicacion));
  }

  crear(datos: DatosPublicacion): Observable<Publicacion> {
    return this.http.post<{ publicacion: Publicacion }>(this.url, datos).pipe(map((r) => r.publicacion));
  }

  editar(id: number, datos: DatosPublicacion): Observable<Publicacion> {
    return this.http
      .put<{ publicacion: Publicacion }>(`${this.url}/${id}`, datos)
      .pipe(map((r) => r.publicacion));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
