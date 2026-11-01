import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ErrorApi, Publicacion } from '../../core/modelos';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SesionService } from '../../core/sesion.service';
import { Comentarios } from './comentarios';
import { Denuncia } from './denuncia';

/**
 * HU-03: detalle de una publicación (/publicaciones/:id). El autor ve "Editar" y "Eliminar";
 * un administrador ve "Eliminar". Ocultar botones es comodidad: el backend decide.
 */
@Component({
  selector: 'app-publicacion-detalle',
  imports: [RouterLink, DatePipe, Comentarios, Denuncia],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacionDetalle implements OnInit {
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  /** :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly publicacion = signal<Publicacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmando = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal<string | null>(null);

  protected readonly esAutor = computed(
    () => !!this.publicacion() && this.publicacion()!.autor.id === this.sesion.usuario()?.id,
  );
  protected readonly puedeEliminar = computed(() => this.esAutor() || this.sesion.esAdmin());
  /** HU-05: denuncian los usuarios con sesión que no son el autor (el backend no lo exige). */
  protected readonly puedeDenunciar = computed(() => this.sesion.autenticado() && !this.esAutor());

  ngOnInit(): void {
    this.publicacionesService.obtener(Number(this.id())).subscribe({
      next: (publicacion) => {
        this.publicacion.set(publicacion);
        this.cargando.set(false);
      },
      error: (respuesta: HttpErrorResponse) => {
        this.error.set(
          respuesta.status === 404 ? 'La publicación no existe o fue eliminada.' : 'No se pudo cargar la publicación.',
        );
        this.cargando.set(false);
      },
    });
  }

  protected eliminar(): void {
    const publicacion = this.publicacion();
    if (!publicacion) return;

    this.eliminando.set(true);
    this.errorEliminar.set(null);
    this.publicacionesService.eliminar(publicacion.id).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (respuesta: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.confirmando.set(false);
        const error = (respuesta.error as { error?: ErrorApi } | null)?.error;
        this.errorEliminar.set(error?.mensaje ?? 'No se pudo eliminar la publicación.');
      },
    });
  }
}
