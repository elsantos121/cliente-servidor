import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Publicacion } from '../../core/modelos';
import { SesionService } from '../../core/sesion.service';
import { Inicio } from './inicio';

const publicacion = (id: number, titulo: string, categoria = { id: 1, nombre: 'Matemática' }): Publicacion => ({
  id,
  titulo,
  contenido: 'Contenido de prueba',
  creadoEn: '2026-11-01T12:00:00Z',
  actualizadoEn: '2026-11-01T12:00:00Z',
  autor: { id: 1, nombre: 'Ana' },
  categoria,
});

describe('Inicio (HU-03)', () => {
  let fixture: ComponentFixture<Inicio>;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  async function crear() {
    fixture = TestBed.createComponent(Inicio);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    http.expectOne(`${api}/categorias`).flush({
      categorias: [
        { id: 1, nombre: 'Matemática', creadoEn: '' },
        { id: 2, nombre: 'Programación', creadoEn: '' },
      ],
    });
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;
  const titulos = () => [...pantalla().querySelectorAll('.item .titulo')].map((a) => a.textContent?.trim());

  it('muestra "Cargando" y después las publicaciones con enlace al detalle', async () => {
    await crear();
    expect(pantalla().textContent).toContain('Cargando publicaciones');

    http.expectOne(`${api}/publicaciones`).flush({ publicaciones: [publicacion(2, 'Segunda'), publicacion(1, 'Primera')] });
    await fixture.whenStable();

    expect(titulos()).toEqual(['Segunda', 'Primera']);
    expect(pantalla().querySelector('.item a')?.getAttribute('href')).toBe('/publicaciones/2');
  });

  it('filtrar por categoría pide ?categoriaId= y "Todas" lo quita', async () => {
    await crear();
    http.expectOne(`${api}/publicaciones`).flush({ publicaciones: [] });
    await fixture.whenStable();
    const select = pantalla().querySelector<HTMLSelectElement>('#filtro-categoria')!;

    select.value = '2';
    select.dispatchEvent(new Event('change'));
    http
      .expectOne((r) => r.url === `${api}/publicaciones` && r.params.get('categoriaId') === '2')
      .flush({ publicaciones: [publicacion(3, 'De programación', { id: 2, nombre: 'Programación' })] });
    await fixture.whenStable();
    expect(titulos()).toEqual(['De programación']);

    select.value = '';
    select.dispatchEvent(new Event('change'));
    http.expectOne((r) => r.url === `${api}/publicaciones` && !r.params.has('categoriaId')).flush({ publicaciones: [] });
  });

  it('sin publicaciones muestra un mensaje', async () => {
    await crear();
    http.expectOne(`${api}/publicaciones`).flush({ publicaciones: [] });
    await fixture.whenStable();

    expect(pantalla().textContent).toContain('Todavía no hay publicaciones');
  });

  it('si falla la carga muestra el error con "Reintentar"', async () => {
    await crear();
    http.expectOne(`${api}/publicaciones`).flush(null, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    pantalla().querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    http.expectOne(`${api}/publicaciones`).flush({ publicaciones: [] });
  });

  it('el botón "Nueva publicación" aparece solo con sesión iniciada', async () => {
    await crear();
    http.expectOne(`${api}/publicaciones`).flush({ publicaciones: [] });
    await fixture.whenStable();
    expect(pantalla().querySelector('a[href="/publicaciones/nueva"]')).toBeNull();

    TestBed.inject(SesionService).iniciar({
      token: 'a.b.c',
      usuario: { id: 1, nombre: 'Ana', email: 'ana@uni.edu', rol: 'ESTUDIANTE', creadoEn: '' },
    });
    await fixture.whenStable();

    expect(pantalla().querySelector('a[href="/publicaciones/nueva"]')).toBeTruthy();
  });
});
