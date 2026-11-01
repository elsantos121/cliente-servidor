import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorApi } from '../../core/modelos';
import { ReportesService } from '../../core/reportes.service';

type Estado = 'cerrado' | 'abierto' | 'enviada' | 'repetida';

/** HU-05: botón y formulario para denunciar una publicación. */
@Component({
  selector: 'app-denuncia',
  imports: [ReactiveFormsModule],
  templateUrl: './denuncia.html',
  styleUrl: './denuncia.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Denuncia {
  private readonly reportesService = inject(ReportesService);

  readonly publicacionId = input.required<number>();

  protected readonly estado = signal<Estado>('cerrado');
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  });

  protected errorValidacion(): string | null {
    const control = this.formulario.controls.motivo;
    if (!control.touched || !control.errors) return null;
    return control.errors['required'] ? 'Contá el motivo de la denuncia' : 'El motivo debe tener entre 5 y 500 caracteres';
  }

  protected abrir(): void {
    this.formulario.reset();
    this.errorEnvio.set(null);
    this.estado.set('abierto');
  }

  protected enviar(): void {
    const control = this.formulario.controls.motivo;
    control.setValue(control.value.trim());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.reportesService.denunciar(this.publicacionId(), control.value).subscribe({
      next: () => {
        this.enviando.set(false);
        this.estado.set('enviada');
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        if (respuesta.status === 409) {
          this.estado.set('repetida');
          return;
        }
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        this.errorEnvio.set(
          respuesta.status === 0
            ? 'No se pudo conectar con el servidor.'
            : (error?.detalles?.['motivo'] ?? error?.mensaje ?? 'No se pudo enviar la denuncia.'),
        );
      },
    });
  }
}
