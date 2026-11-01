import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComentariosService } from '../../core/comentarios.service';
import { Comentario, ErrorApi } from '../../core/modelos';
import { SesionService } from '../../core/sesion.service';

/** HU-04: sección de comentarios del detalle de una publicación. */
@Component({
  selector: 'app-comentarios',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './comentarios.html',
  styleUrl: './comentarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comentarios implements OnInit {
  private readonly comentariosService = inject(ComentariosService);
  protected readonly sesion = inject(SesionService);
  /** URL actual, para volver aquí después de iniciar sesión. */
  protected readonly urlActual = inject(Router).url;

  readonly publicacionId = input.required<number>();

  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    contenido: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.comentariosService.listar(this.publicacionId()).subscribe({
      next: (comentarios) => {
        this.comentarios.set(comentarios);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudieron cargar los comentarios.');
        this.cargando.set(false);
      },
    });
  }

  protected errorValidacion(): string | null {
    const control = this.formulario.controls.contenido;
    if (!control.touched || !control.errors) return null;
    return control.errors['required'] ? 'El comentario no puede estar vacío' : 'El comentario no puede superar 2000 caracteres';
  }

  protected enviar(): void {
    const control = this.formulario.controls.contenido;
    control.setValue(control.value.trim());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.comentariosService.comentar(this.publicacionId(), control.value).subscribe({
      next: (comentario) => {
        this.enviando.set(false);
        this.comentarios.update((lista) => [...lista, comentario]);
        this.formulario.reset();
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        if (respuesta.status === 0) {
          this.errorEnvio.set('No se pudo conectar con el servidor.');
        } else {
          this.errorEnvio.set(error?.detalles?.['contenido'] ?? error?.mensaje ?? 'No se pudo publicar el comentario.');
        }
      },
    });
  }
}
