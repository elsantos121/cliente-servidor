import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadoReporte, Reporte, ReporteModeracion } from './modelos';

/** HU-05 (denunciar) y HU-06b (moderar, solo ADMIN). */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  denunciar(publicacionId: number, motivo: string): Observable<Reporte> {
    return this.http
      .post<{ reporte: Reporte }>(`${environment.apiUrl}/publicaciones/${publicacionId}/reportes`, { motivo })
      .pipe(map((r) => r.reporte));
  }

  listar(estado: EstadoReporte): Observable<ReporteModeracion[]> {
    return this.http
      .get<{ reportes: ReporteModeracion[] }>(this.url, { params: { estado } })
      .pipe(map((r) => r.reportes));
  }

  cambiarEstado(id: number, estado: Exclude<EstadoReporte, 'PENDIENTE'>): Observable<ReporteModeracion> {
    return this.http
      .patch<{ reporte: ReporteModeracion }>(`${this.url}/${id}`, { estado })
      .pipe(map((r) => r.reporte));
  }
}
