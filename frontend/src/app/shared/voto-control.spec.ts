import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { ResumenVotos, Usuario } from '../core/modelos';
import { SesionService } from '../core/sesion.service';
import { VotoControl } from './voto-control';

const ana: Usuario = { id: 1, nombre: 'Ana', email: 'ana@uni.edu', rol: 'ESTUDIANTE', creadoEn: '' };
const sinVotos: ResumenVotos = { positivos: 0, negativos: 0, miVoto: null };

describe('VotoControl (HU-07)', () => {
  let fixture: ComponentFixture<VotoControl>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [VotoControl],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;

  async function abrir(tipo: 'publicacion' | 'comentario', conSesion: boolean, votos = sinVotos) {
    if (conSesion) TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario: ana });
    fixture = TestBed.createComponent(VotoControl);
    fixture.componentRef.setInput('tipo', tipo);
    fixture.componentRef.setInput('recursoId', 5);
    fixture.componentRef.setInput('resumen', votos);
    await fixture.whenStable();
  }

  it('muestra conteos al visitante y ofrece iniciar sesión para votar', async () => {
    await abrir('publicacion', false, { positivos: 3, negativos: 1, miVoto: null });

    expect(pantalla().querySelector('[aria-label="Voto positivo"]')?.textContent).toContain('3');
    expect(pantalla().querySelector('[aria-label="Voto negativo"]')?.textContent).toContain('1');
    expect(pantalla().querySelector('[aria-label="Voto positivo"]')?.hasAttribute('disabled')).toBe(true);
    expect(pantalla().querySelector('a[href="/login"]')?.textContent).toContain('Iniciá sesión');
  });

  it('permite votar positivo y actualiza conteos y selección', async () => {
    await abrir('publicacion', true);

    pantalla().querySelector<HTMLButtonElement>('[aria-label="Voto positivo"]')!.click();
    const solicitud = http.expectOne({ method: 'PUT', url: `${environment.apiUrl}/votos/publicaciones/5` });
    expect(solicitud.request.body).toEqual({ valor: 'POSITIVO' });
    solicitud.flush({ votos: { positivos: 1, negativos: 0, miVoto: 'POSITIVO' } });
    await fixture.whenStable();

    expect(pantalla().querySelector('[aria-label="Voto positivo"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(pantalla().querySelector('[aria-label="Voto positivo"]')?.textContent).toContain('1');
  });

  it('al volver a pulsar el voto actual lo retira', async () => {
    await abrir('comentario', true, { positivos: 1, negativos: 0, miVoto: 'POSITIVO' });

    pantalla().querySelector<HTMLButtonElement>('[aria-label="Voto positivo"]')!.click();
    const solicitud = http.expectOne({ method: 'DELETE', url: `${environment.apiUrl}/votos/comentarios/5` });
    solicitud.flush({ votos: sinVotos });
    await fixture.whenStable();

    expect(pantalla().querySelector('[aria-label="Voto positivo"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(pantalla().querySelector('[aria-label="Voto positivo"]')?.textContent).toContain('0');
  });

  it('muestra el error de la API si no se puede registrar un voto', async () => {
    await abrir('publicacion', true);

    pantalla().querySelector<HTMLButtonElement>('[aria-label="Voto negativo"]')!.click();
    http
      .expectOne({ method: 'PUT', url: `${environment.apiUrl}/votos/publicaciones/5` })
      .flush({ error: { codigo: 'PROHIBIDO', mensaje: 'No podés votar tu propio contenido' } }, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('No podés votar tu propio contenido');
  });
});
