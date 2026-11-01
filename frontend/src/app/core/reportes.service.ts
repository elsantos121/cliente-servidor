import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reporte } from './modelos';

/** HU-05: denuncias de publicaciones (la moderación de HU-06b se agregará aquí). */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  denunciar(publicacionId: number, motivo: string): Observable<Reporte> {
    return this.http
      .post<{ reporte: Reporte }>(`${environment.apiUrl}/publicaciones/${publicacionId}/reportes`, { motivo })
      .pipe(map((r) => r.reporte));
  }
}
