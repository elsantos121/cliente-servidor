import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriasService } from '../../core/categorias.service';
import { Categoria, ErrorApi } from '../../core/modelos';

/** HU-06a: panel de administración de categorías (/admin/categorias, solo ADMIN). */
@Component({
  selector: 'app-admin-categorias',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categorias.html',
  styleUrl: './admin-categorias.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategorias {
  private readonly categoriasService = inject(CategoriasService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
  });
  private readonly nombre = this.formulario.controls.nombre;
  protected readonly enviando = signal(false);
  protected readonly errorNombre = signal<string | null>(null);
  protected readonly creada = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.categoriasService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudieron cargar las categorías.');
        this.cargando.set(false);
      },
    });
  }

  protected errorValidacion(): string | null {
    const control = this.nombre;
    if (!control.touched || !control.errors) return null;
    return control.errors['required'] ? 'El nombre es obligatorio' : 'El nombre debe tener entre 2 y 50 caracteres';
  }

  protected crear(): void {
    this.creada.set(null);
    this.errorNombre.set(null);
    this.nombre.setValue(this.nombre.value.trim());
    if (this.nombre.invalid) {
      this.nombre.markAsTouched();
      return;
    }

    this.enviando.set(true);
    this.categoriasService.crear(this.nombre.value).subscribe({
      next: (categoria) => {
        this.enviando.set(false);
        this.categorias.update((lista) =>
          [...lista, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        );
        this.creada.set(categoria.nombre);
        this.nombre.reset();
      },
      error: (respuesta: HttpErrorResponse) => {
        this.enviando.set(false);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        if (respuesta.status === 400 && error?.detalles?.['nombre']) {
          this.errorNombre.set(error.detalles['nombre']);
        } else if (respuesta.status === 0) {
          this.errorNombre.set('No se pudo conectar con el servidor.');
        } else {
          // 409 (duplicado), 403 (sin permiso) u otro: el mensaje del servidor ya es claro.
          this.errorNombre.set(error?.mensaje ?? 'No se pudo crear la categoría.');
        }
      },
    });
  }
}
