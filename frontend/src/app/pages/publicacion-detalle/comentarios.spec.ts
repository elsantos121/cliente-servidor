import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Comentario } from '../../core/modelos';
import { SesionService } from '../../core/sesion.service';
import { Comentarios } from './comentarios';

const comentario = (id: number, contenido: string, nombre = 'Beto'): Comentario => ({
  id,
  contenido,
  creadoEn: '2026-11-01T12:00:00Z',
  autor: { id, nombre },
});

describe('Comentarios (HU-04)', () => {
  let fixture: ComponentFixture<Comentarios>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/publicaciones/5/comentarios`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Comentarios],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function abrir(conSesion: boolean, existentes: Comentario[] = []) {
    if (conSesion) {
      TestBed.inject(SesionService).iniciar({
        token: 'a.b.c',
        usuario: { id: 2, nombre: 'Beto', email: 'beto@uni.edu', rol: 'ESTUDIANTE', creadoEn: '' },
      });
    }
    fixture = TestBed.createComponent(Comentarios);
    fixture.componentRef.setInput('publicacionId', 5);
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url }).flush({ comentarios: existentes });
    await fixture.whenStable();
  }

  const pantalla = () => fixture.nativeElement as HTMLElement;
  const textos = () => [...pantalla().querySelectorAll('.comentario .texto')].map((p) => p.textContent?.trim());

  async function escribirYEnviar(texto: string) {
    const area = pantalla().querySelector<HTMLTextAreaElement>('#nuevo-comentario')!;
    area.value = texto;
    area.dispatchEvent(new Event('input'));
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('lista los comentarios en el orden recibido, con autor y cantidad', async () => {
    await abrir(false, [comentario(1, 'Primero'), comentario(2, 'Segundo', 'Ana')]);

    expect(textos()).toEqual(['Primero', 'Segundo']);
    expect(pantalla().querySelector('.comentario .meta')?.textContent).toContain('Beto');
    expect(pantalla().querySelector('h2')?.textContent).toContain('(2)');
  });

  it('sin comentarios muestra un mensaje', async () => {
    await abrir(false);

    expect(pantalla().textContent).toContain('Todavía no hay comentarios');
  });

  it('sin sesión no muestra el formulario y ofrece iniciar sesión', async () => {
    await abrir(false);

    expect(pantalla().querySelector('form')).toBeNull();
    expect(pantalla().querySelector('a[href^="/login"]')?.textContent).toContain('Iniciá sesión');
  });

  it('con sesión, un comentario vacío no se envía', async () => {
    await abrir(true);

    await escribirYEnviar('   ');

    http.expectNone({ method: 'POST', url });
    expect(pantalla().querySelector('#error-comentario')?.textContent).toContain('no puede estar vacío');
  });

  it('con sesión, comenta y agrega el comentario al final de la lista', async () => {
    await abrir(true, [comentario(1, 'Primero', 'Ana')]);

    await escribirYEnviar('  Probá con L’Hôpital ');
    const solicitud = http.expectOne({ method: 'POST', url });
    expect(solicitud.request.body).toEqual({ contenido: 'Probá con L’Hôpital' });
    solicitud.flush({ comentario: comentario(2, 'Probá con L’Hôpital') }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(textos()).toEqual(['Primero', 'Probá con L’Hôpital']);
    expect(pantalla().querySelector<HTMLTextAreaElement>('#nuevo-comentario')!.value).toBe('');
  });

  it('si la publicación ya no existe (404) muestra el mensaje del servidor', async () => {
    await abrir(true);

    await escribirYEnviar('Hola');
    http.expectOne({ method: 'POST', url }).flush(
      { error: { codigo: 'NO_ENCONTRADO', mensaje: 'Publicación no encontrado' } },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('#error-comentario')?.textContent).toContain('Publicación no encontrado');
  });
});
