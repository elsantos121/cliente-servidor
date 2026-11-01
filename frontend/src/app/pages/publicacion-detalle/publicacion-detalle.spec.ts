import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Publicacion, Usuario } from '../../core/modelos';
import { SesionService } from '../../core/sesion.service';
import { PublicacionDetalle } from './publicacion-detalle';

@Component({ template: '' })
class Vacia {}

const ana: Usuario = { id: 1, nombre: 'Ana', email: 'ana@uni.edu', rol: 'ESTUDIANTE', creadoEn: '' };
const beto: Usuario = { ...ana, id: 2, nombre: 'Beto', email: 'beto@uni.edu' };
const admin: Usuario = { ...ana, id: 3, nombre: 'Admin', email: 'admin@uni.edu', rol: 'ADMIN' };

const publicacion: Publicacion = {
  id: 5,
  titulo: 'Ayuda con límites',
  contenido: 'Primera línea\nSegunda línea',
  creadoEn: '2026-11-01T12:00:00Z',
  actualizadoEn: '2026-11-01T12:00:00Z',
  autor: { id: ana.id, nombre: 'Ana' },
  categoria: { id: 1, nombre: 'Matemática' },
};

describe('PublicacionDetalle (HU-03)', () => {
  let fixture: ComponentFixture<PublicacionDetalle>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/publicaciones/5`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PublicacionDetalle],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: Vacia }])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function abrir(usuario: Usuario | null, respuesta: Publicacion | 404 = publicacion) {
    if (usuario) TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario });
    fixture = TestBed.createComponent(PublicacionDetalle);
    fixture.componentRef.setInput('id', '5');
    await fixture.whenStable();
    const solicitud = http.expectOne(url);
    if (respuesta === 404) {
      solicitud.flush({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Publicación no encontrado' } }, { status: 404, statusText: 'Not Found' });
    } else {
      solicitud.flush({ publicacion: respuesta });
      await fixture.whenStable();
      // La sección de comentarios (HU-04) carga los suyos al aparecer.
      http.expectOne(`${url}/comentarios`).flush({ comentarios: [] });
    }
    await fixture.whenStable();
  }

  const pantalla = () => fixture.nativeElement as HTMLElement;
  const botones = () => [...pantalla().querySelectorAll('.acciones .boton')].map((b) => b.textContent?.trim());

  it('muestra título, categoría, autor, contenido y la sección de comentarios', async () => {
    await abrir(null);

    expect(pantalla().querySelector('app-comentarios')).toBeTruthy();

    expect(pantalla().querySelector('h1')?.textContent).toBe('Ayuda con límites');
    expect(pantalla().querySelector('.meta')?.textContent).toContain('Matemática');
    expect(pantalla().querySelector('.meta')?.textContent).toContain('Ana');
    expect(pantalla().querySelector('.contenido')?.textContent).toBe('Primera línea\nSegunda línea');
  });

  it('un visitante y otro estudiante no ven acciones', async () => {
    await abrir(beto);

    expect(pantalla().querySelector('.acciones')).toBeNull();
  });

  it('el autor ve "Editar" y "Eliminar"', async () => {
    await abrir(ana);

    expect(botones()).toEqual(['Editar', 'Eliminar']);
    expect(pantalla().querySelector('a.boton')?.getAttribute('href')).toBe('/publicaciones/5/editar');
  });

  it('un administrador ve solo "Eliminar"', async () => {
    await abrir(admin);

    expect(botones()).toEqual(['Eliminar']);
  });

  it('eliminar pide confirmación, llama a la API y vuelve al inicio', async () => {
    await abrir(ana);
    const router = TestBed.inject(Router);

    pantalla().querySelector<HTMLButtonElement>('.acciones button')!.click();
    await fixture.whenStable();
    http.expectNone({ method: 'DELETE', url });
    expect(pantalla().querySelector('.confirmar')?.textContent).toContain('¿Eliminar la publicación?');

    pantalla().querySelector<HTMLButtonElement>('.boton--peligro')!.click();
    http.expectOne({ method: 'DELETE', url }).flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(router.url).toBe('/');
  });

  it('si el servidor rechaza la eliminación (403) muestra su mensaje', async () => {
    await abrir(ana);
    pantalla().querySelector<HTMLButtonElement>('.acciones button')!.click();
    await fixture.whenStable();

    pantalla().querySelector<HTMLButtonElement>('.boton--peligro')!.click();
    http.expectOne({ method: 'DELETE', url }).flush(
      { error: { codigo: 'PROHIBIDO', mensaje: 'Solo el autor o un administrador pueden eliminar la publicación' } },
      { status: 403, statusText: 'Forbidden' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('Solo el autor');
  });

  it('la opción de denunciar la ven otros usuarios con sesión, no el autor ni un visitante (HU-05)', async () => {
    await abrir(beto);
    expect(pantalla().querySelector('app-denuncia')).toBeTruthy();
  });

  it('el autor y un visitante no ven la opción de denunciar (HU-05)', async () => {
    await abrir(ana);
    expect(pantalla().querySelector('app-denuncia')).toBeNull();

    TestBed.inject(SesionService).cerrar();
    await fixture.whenStable();
    expect(pantalla().querySelector('app-denuncia')).toBeNull();
  });

  it('una publicación inexistente muestra un aviso', async () => {
    await abrir(null, 404);

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('no existe');
  });
});
