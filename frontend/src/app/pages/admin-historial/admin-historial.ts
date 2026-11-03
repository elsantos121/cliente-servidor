import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AccionModeracion, EventoModeracion } from '../../core/modelos';
import { ModeracionService } from '../../core/moderacion.service';

const ETIQUETAS: Record<AccionModeracion, string> = {
  REPORTE_RESUELTO: 'Reporte marcado como resuelto',
  REPORTE_DESCARTADO: 'Reporte descartado',
  PUBLICACION_OCULTADA: 'Publicación ocultada durante revisión',
  PUBLICACION_RESTAURADA: 'Publicación restaurada',
  PUBLICACION_ELIMINADA: 'Publicación eliminada',
};

@Component({
  selector: 'app-admin-historial',
  imports: [DatePipe],
  templateUrl: './admin-historial.html',
  styleUrl: './admin-historial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHistorial {
  private readonly moderacionService = inject(ModeracionService);

  protected readonly acciones = Object.keys(ETIQUETAS) as AccionModeracion[];
  protected readonly etiquetas = ETIQUETAS;
  protected readonly eventos = signal<EventoModeracion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  protected filtrar(publicacionId: string, accionSeleccionada: string): void {
    const accion = this.acciones.find((opcion) => opcion === accionSeleccionada);
    this.cargar({ publicacionId: publicacionId.trim() || undefined, accion });
  }

  protected cargar(filtro: { publicacionId?: string; accion?: AccionModeracion } = {}): void {
    this.cargando.set(true);
    this.error.set(null);
    this.moderacionService.listarHistorial(filtro).subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial.');
        this.cargando.set(false);
      },
    });
  }
}
