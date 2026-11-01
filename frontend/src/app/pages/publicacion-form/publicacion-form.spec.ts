import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Publicacion, Usuario } from '../../core/modelos';
import { SesionService } from '../../core/sesion.service';
import { PublicacionForm } from './publicacion-form';

@Component({ template: '' })
class Vacia {}

const ana: Usuario = { id: 1, nombre: 'Ana', email: 'ana@uni.edu', rol: 'ESTUDIANTE', creadoEn: '' };
const beto: Usuario = { ...ana, id: 2, nombre: 'Beto' };

const existente: Publicacion = {
  id: 5,
  titulo: 'Título original',
  contenido: 'Contenido original de la publicación',
  creadoEn: '',
  actualizadoEn: '',
  autor: { id: ana.id, nombre: 'Ana' },
  categoria: { id: 2, nombre: 'Programación' },
};

describe('PublicacionForm (HU-03)', () => {
  let fixture: ComponentFixture<PublicacionForm>;
  let http: HttpTestingController;
  let router: Router;
  const api = environment.apiUrl;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PublicacionForm],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: Vacia }])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario: ana });
  });

  afterEach(() => http.verify());

  async function abrir(id?: string) {
    fixture = TestBed.createComponent(PublicacionForm);
    if (id) fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
    http.expectOne(`${api}/categorias`).flush({
      categorias: [
        { id: 1, nombre: 'Matemática', creadoEn: '' },
        { id: 2, nombre: 'Programación', creadoEn: '' },
      ],
    });
    await fixture.whenStable();
  }

  const pantalla = () => fixture.nativeElement as HTMLElement;

  function completar(campo: string, valor: string) {
    const control = pantalla().querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${campo}`)!;
    control.value = valor;
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
    control.dispatchEvent(new Event('blur'));
  }

  async function enviar() {
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('al crear, valida los campos antes de llamar a la API', async () => {
    await abrir();
    await enviar();

    http.expectNone({ method: 'POST', url: `${api}/publicaciones` });
    expect(pantalla().querySelector('#error-titulo')?.textContent).toContain('obligatorio');
    expect(pantalla().querySelector('#error-categoria')?.textContent).toContain('Elegí una categoría');
    expect(pantalla().querySelector('#error-contenido')?.textContent).toContain('obligatorio');
  });

  it('crea la publicación y navega a su detalle', async () => {
    await abrir();
    expect(pantalla().querySelector('h1')?.textContent).toContain('Nueva publicación');

    completar('titulo', '  Ayuda con límites ');
    completar('categoria', '1');
    completar('contenido', 'Necesito ayuda con el ejercicio 3.');
    await enviar();

    const solicitud = http.expectOne({ method: 'POST', url: `${api}/publicaciones` });
    expect(solicitud.request.body).toEqual({
      titulo: 'Ayuda con límites',
      contenido: 'Necesito ayuda con el ejercicio 3.',
      categoriaId: 1,
    });
    solicitud.flush({ publicacion: { ...existente, id: 9 } }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(router.url).toBe('/publicaciones/9');
  });

  it('muestra los errores por campo que devuelve el servidor (400)', async () => {
    await abrir();
    completar('titulo', 'Ayuda con límites');
    completar('categoria', '1');
    completar('contenido', 'Necesito ayuda con el ejercicio 3.');
    await enviar();

    http.expectOne({ method: 'POST', url: `${api}/publicaciones` }).flush(
      { error: { codigo: 'VALIDACION', mensaje: 'Datos inválidos', detalles: { categoriaId: 'La categoría no existe' } } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('#error-categoria')?.textContent).toContain('La categoría no existe');
  });

  it('al editar, carga los datos y guarda con PUT', async () => {
    await abrir('5');
    http.expectOne(`${api}/publicaciones/5`).flush({ publicacion: existente });
    await fixture.whenStable();

    expect(pantalla().querySelector('h1')?.textContent).toContain('Editar publicación');
    expect(pantalla().querySelector<HTMLInputElement>('#titulo')!.value).toBe('Título original');
    expect(pantalla().querySelector<HTMLSelectElement>('#categoria')!.value).toBe('2');

    completar('titulo', 'Título nuevo');
    await enviar();

    const solicitud = http.expectOne({ method: 'PUT', url: `${api}/publicaciones/5` });
    expect(solicitud.request.body).toEqual({
      titulo: 'Título nuevo',
      contenido: 'Contenido original de la publicación',
      categoriaId: 2,
    });
    solicitud.flush({ publicacion: { ...existente, titulo: 'Título nuevo' } });
    await fixture.whenStable();

    expect(router.url).toBe('/publicaciones/5');
  });

  it('si la publicación es de otro usuario, no muestra el formulario', async () => {
    TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario: beto });
    await abrir('5');
    http.expectOne(`${api}/publicaciones/5`).flush({ publicacion: existente });
    await fixture.whenStable();

    expect(pantalla().querySelector('form')).toBeNull();
    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('Solo el autor');
  });
});
