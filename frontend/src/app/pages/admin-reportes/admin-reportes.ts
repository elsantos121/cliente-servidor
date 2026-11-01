import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ErrorApi, EstadoReporte, ReporteModeracion } from '../../core/modelos';
import { PublicacionesService } from '../../core/publicaciones.service';
import { ReportesService } from '../../core/reportes.service';

const ETIQUETAS: Record<EstadoReporte, string> = {
  PENDIENTE: 'Pendientes',
  RESUELTO: 'Resueltos',
  DESCARTADO: 'Descartados',
};

/**
 * HU-06b: panel de moderación (/admin/reportes, solo ADMIN). Un reporte pendiente se puede marcar
 * resuelto, descartar o resolver eliminando la publicación (que borra también sus reportes).
 */
@Component({
  selector: 'app-admin-reportes',
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-reportes.html',
  styleUrl: './admin-reportes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReportes {
  private readonly reportesService = inject(ReportesService);
  private readonly publicacionesService = inject(PublicacionesService);

  protected readonly estados = Object.keys(ETIQUETAS) as EstadoReporte[];
  protected readonly etiquetas = ETIQUETAS;

  protected readonly estado = signal<EstadoReporte>('PENDIENTE');
  protected readonly reportes = signal<ReporteModeracion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);

  /** Reporte con una acción en curso, el que pide confirmar el borrado y los errores por reporte. */
  protected readonly procesando = signal<number | null>(null);
  protected readonly confirmandoBorrado = signal<number | null>(null);
  protected readonly errores = signal<Record<number, string>>({});
  protected readonly aviso = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  protected verEstado(estado: EstadoReporte): void {
    if (estado === this.estado()) return;
    this.estado.set(estado);
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.aviso.set(null);
    this.reportesService.listar(this.estado()).subscribe({
      next: (reportes) => {
        this.reportes.set(reportes);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudieron cargar los reportes.');
        this.cargando.set(false);
      },
    });
  }

  protected marcar(reporte: ReporteModeracion, estado: 'RESUELTO' | 'DESCARTADO'): void {
    const mensaje = estado === 'RESUELTO' ? 'marcado como resuelto' : 'descartado';
    this.ejecutar(reporte, this.reportesService.cambiarEstado(reporte.id, estado), () => {
      this.reportes.update((lista) => lista.filter((r) => r.id !== reporte.id));
      this.aviso.set(`Reporte sobre «${reporte.publicacion.titulo}» ${mensaje}.`);
    });
  }

  /** Eliminar la publicación borra todos sus reportes (cascada): se quitan todos de la lista. */
  protected eliminarPublicacion(reporte: ReporteModeracion): void {
    const { id, titulo } = reporte.publicacion;
    this.ejecutar(reporte, this.publicacionesService.eliminar(id), () => {
      this.reportes.update((lista) => lista.filter((r) => r.publicacion.id !== id));
      this.aviso.set(`Se eliminó la publicación «${titulo}» y sus reportes.`);
    });
  }

  private ejecutar(reporte: ReporteModeracion, operacion: Observable<unknown>, alTerminar: () => void): void {
    this.procesando.set(reporte.id);
    this.aviso.set(null);
    this.errores.update((e) => ({ ...e, [reporte.id]: '' }));
    operacion.subscribe({
      next: () => {
        this.procesando.set(null);
        this.confirmandoBorrado.set(null);
        alTerminar();
      },
      error: (respuesta: HttpErrorResponse) => {
        this.procesando.set(null);
        this.confirmandoBorrado.set(null);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        this.errores.update((e) => ({ ...e, [reporte.id]: error?.mensaje ?? 'No se pudo completar la acción.' }));
      },
    });
  }
}
