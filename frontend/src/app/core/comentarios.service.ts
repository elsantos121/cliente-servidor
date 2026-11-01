import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comentario } from './modelos';

/** HU-04: comentarios de una publicación (GET público, POST con sesión). */
@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private readonly http = inject(HttpClient);

  private url(publicacionId: number): string {
    return `${environment.apiUrl}/publicaciones/${publicacionId}/comentarios`;
  }

  listar(publicacionId: number): Observable<Comentario[]> {
    return this.http.get<{ comentarios: Comentario[] }>(this.url(publicacionId)).pipe(map((r) => r.comentarios));
  }

  comentar(publicacionId: number, contenido: string): Observable<Comentario> {
    return this.http
      .post<{ comentario: Comentario }>(this.url(publicacionId), { contenido })
      .pipe(map((r) => r.comentario));
  }
}
