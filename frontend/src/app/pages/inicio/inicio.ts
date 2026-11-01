import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriasService } from '../../core/categorias.service';
import { Categoria, Publicacion } from '../../core/modelos';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SesionService } from '../../core/sesion.service';

/** HU-03: inicio (/) con el listado de publicaciones y filtro por categoría. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, DatePipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  private readonly publicacionesService = inject(PublicacionesService);
  protected readonly sesion = inject(SesionService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaId = signal<number | undefined>(undefined);
  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Si fallan las categorías, el listado igual funciona: solo falta el filtro.
    inject(CategoriasService)
      .listar()
      .subscribe({ next: (categorias) => this.categorias.set(categorias), error: () => undefined });
    this.cargar();
  }

  protected filtrar(valor: string): void {
    this.categoriaId.set(valor ? Number(valor) : undefined);
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.publicacionesService.listar(this.categoriaId()).subscribe({
      next: (publicaciones) => {
        this.publicaciones.set(publicaciones);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las publicaciones.');
        this.cargando.set(false);
      },
    });
  }
}
