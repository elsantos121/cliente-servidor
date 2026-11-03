import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AdminHistorial } from './admin-historial';

describe('AdminHistorial (HU-09)', () => {
  let fixture: ComponentFixture<AdminHistorial>;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHistorial],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminHistorial);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;

  it('muestra la acción, el recurso, el actor y la fecha', async () => {
    http.expectOne({ method: 'GET', url: `${api}/moderacion/historial` }).flush({
      eventos: [
        {
          id: 1,
          accion: 'PUBLICACION_ELIMINADA',
          creadoEn: '2026-11-03T12:00:00Z',
          actor: { id: 1, nombre: 'Admin', rol: 'ADMIN' },
          publicacion: { id: 7, titulo: 'Publicación dudosa' },
          reporte: null,
        },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pantalla().textContent).toContain('Publicación eliminada');
    expect(pantalla().textContent).toContain('Publicación dudosa');
    expect(pantalla().textContent).toContain('Admin');
    expect(pantalla().querySelector('time')?.getAttribute('datetime')).toBe('2026-11-03T12:00:00Z');
  });

  it('envía los filtros de publicación y acción', async () => {
    http.expectOne({ method: 'GET', url: `${api}/moderacion/historial` }).flush({ eventos: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    (pantalla().querySelector('#publicacionId') as HTMLInputElement).value = '7';
    (pantalla().querySelector('#accion') as HTMLSelectElement).value = 'PUBLICACION_OCULTADA';
    pantalla().querySelector('form')?.dispatchEvent(new Event('submit'));

    const solicitud = http.expectOne(
      (r) =>
        r.url === `${api}/moderacion/historial` &&
        r.params.get('publicacionId') === '7' &&
        r.params.get('accion') === 'PUBLICACION_OCULTADA',
    );
    solicitud.flush({ eventos: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pantalla().textContent).toContain('No hay eventos de moderación');
  });

  it('muestra un error recuperable si no se puede cargar el historial', async () => {
    http
      .expectOne({ method: 'GET', url: `${api}/moderacion/historial` })
      .flush({ error: { codigo: 'INTERNAL', mensaje: 'Error inesperado' } }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar el historial');
  });
});
