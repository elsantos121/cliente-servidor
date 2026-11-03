import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnChanges, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorApi, ResumenVotos, ValorVoto } from '../core/modelos';
import { SesionService } from '../core/sesion.service';
import { VotosService } from '../core/votos.service';

@Component({
  selector: 'app-voto-control',
  imports: [RouterLink],
  templateUrl: './voto-control.html',
  styleUrl: './voto-control.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotoControl implements OnChanges {
  private readonly votosService = inject(VotosService);
  protected readonly sesion = inject(SesionService);

  readonly tipo = input.required<'publicacion' | 'comentario'>();
  readonly recursoId = input.required<number>();
  readonly resumen = input.required<ResumenVotos>();

  protected readonly votos = signal<ResumenVotos>({ positivos: 0, negativos: 0, miVoto: null });
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnChanges(): void {
    this.votos.set(this.resumen());
  }

  protected cambiar(valor: ValorVoto): void {
    if (!this.sesion.autenticado() || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    const operacion =
      this.votos().miVoto === valor
        ? this.votosService.quitar(this.tipo(), this.recursoId())
        : this.votosService.votar(this.tipo(), this.recursoId(), valor);

    operacion.subscribe({
      next: (resumen) => {
        this.votos.set(resumen);
        this.procesando.set(false);
      },
      error: (respuesta: HttpErrorResponse) => {
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        this.error.set(error?.mensaje ?? 'No se pudo registrar el voto.');
        this.procesando.set(false);
      },
    });
  }
}
