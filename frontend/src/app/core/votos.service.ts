import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResumenVotos, ValorVoto } from './modelos';

@Injectable({ providedIn: 'root' })
export class VotosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/votos`;

  votar(tipo: 'publicacion' | 'comentario', id: number, valor: ValorVoto): Observable<ResumenVotos> {
    return this.http
      .put<{ votos: ResumenVotos }>(`${this.url}/${this.recurso(tipo)}/${id}`, { valor })
      .pipe(map((respuesta) => respuesta.votos));
  }

  quitar(tipo: 'publicacion' | 'comentario', id: number): Observable<ResumenVotos> {
    return this.http
      .delete<{ votos: ResumenVotos }>(`${this.url}/${this.recurso(tipo)}/${id}`)
      .pipe(map((respuesta) => respuesta.votos));
  }

  private recurso(tipo: 'publicacion' | 'comentario'): string {
    return tipo === 'publicacion' ? 'publicaciones' : 'comentarios';
  }
}
