import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoriasService } from '../../core/categorias.service';
import { Categoria, ErrorApi } from '../../core/modelos';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SesionService } from '../../core/sesion.service';

type Campo = 'titulo' | 'contenido' | 'categoriaId';

const MENSAJES: Record<Campo, Record<string, string>> = {
  titulo: {
    required: 'El título es obligatorio',
    minlength: 'El título debe tener entre 3 y 150 caracteres',
    maxlength: 'El título debe tener entre 3 y 150 caracteres',
  },
  contenido: {
    required: 'El contenido es obligatorio',
    minlength: 'El contenido debe tener entre 10 y 5000 caracteres',
    maxlength: 'El contenido debe tener entre 10 y 5000 caracteres',
  },
  categoriaId: { required: 'Elegí una categoría' },
};

/**
 * HU-03: crear (/publicaciones/nueva) o editar (/publicaciones/:id/editar) una publicación.
 * Con :id carga la publicación; solo su autor puede guardarla (el backend responde 403 si no).
 */
@Component({
  selector: 'app-publicacion-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publicacion-form.html',
  styleUrl: './publicacion-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacionForm implements OnInit {
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  /** :id de la ruta: vacío al crear. */
  readonly id = input<string>();

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    contenido: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    categoriaId: ['', Validators.required],
  });

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly bloqueo = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresServidor = signal<Partial<Record<Campo, string>>>({});

  constructor() {
    inject(CategoriasService)
      .listar()
      .subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: () => this.errorGeneral.set('No se pudieron cargar las categorías.'),
      });
  }

  protected editando(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    if (!this.editando()) return;

    this.cargando.set(true);
    this.publicacionesService.obtener(Number(this.id())).subscribe({
      next: (publicacion) => {
        this.cargando.set(false);
        if (publicacion.autor.id !== this.sesion.usuario()?.id) {
          this.bloqueo.set('Solo el autor puede editar esta publicación.');
          return;
        }
        this.formulario.setValue({
          titulo: publicacion.titulo,
          contenido: publicacion.contenido,
          categoriaId: String(publicacion.categoria.id),
        });
      },
      error: (respuesta: HttpErrorResponse) => {
        this.cargando.set(false);
        this.bloqueo.set(
          respuesta.status === 404 ? 'La publicación no existe o fue eliminada.' : 'No se pudo cargar la publicación.',
        );
      },
    });
  }

  protected errorDe(campo: Campo): string | null {
    const delServidor = this.erroresServidor()[campo];
    if (delServidor) return delServidor;
    const control = this.formulario.controls[campo];
    if (!control.touched || !control.errors) return null;
    return MENSAJES[campo][Object.keys(control.errors)[0]] ?? 'Valor inválido';
  }

  protected limpiarErrorServidor(campo: Campo): void {
    this.erroresServidor.update((errores) => ({ ...errores, [campo]: undefined }));
  }

  protected enviar(): void {
    const { titulo, contenido, categoriaId } = this.formulario.getRawValue();
    this.formulario.patchValue({ titulo: titulo.trim(), contenido: contenido.trim() });
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorGeneral.set(null);
    this.erroresServidor.set({});

    const datos = { titulo: titulo.trim(), contenido: contenido.trim(), categoriaId: Number(categoriaId) };
    const operacion = this.editando()
      ? this.publicacionesService.editar(Number(this.id()), datos)
      : this.publicacionesService.crear(datos);

    operacion.subscribe({
      next: (publicacion) => void this.router.navigate(['/publicaciones', publicacion.id]),
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        if (respuesta.status === 400 && error?.detalles) {
          this.erroresServidor.set(error.detalles);
        } else if (respuesta.status === 0) {
          this.errorGeneral.set('No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.');
        } else {
          this.errorGeneral.set(error?.mensaje ?? 'No se pudo guardar la publicación.');
        }
      },
    });
  }
}
