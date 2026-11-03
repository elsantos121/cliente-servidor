import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccionModeracion, EventoModeracion } from './modelos';

@Injectable({ providedIn: 'root' })
export class ModeracionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/moderacion/historial`;

  listarHistorial(filtro: { publicacionId?: string; accion?: AccionModeracion }): Observable<EventoModeracion[]> {
    let params = new HttpParams();
    if (filtro.publicacionId) params = params.set('publicacionId', filtro.publicacionId);
    if (filtro.accion) params = params.set('accion', filtro.accion);
    return this.http.get<{ eventos: EventoModeracion[] }>(this.url, { params }).pipe(map((r) => r.eventos));
  }
}
