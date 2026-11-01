import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ReporteModeracion } from '../../core/modelos';
import { AdminReportes } from './admin-reportes';

const reporte = (id: number, publicacionId: number, titulo: string, motivo = 'Contenido ofensivo'): ReporteModeracion => ({
  id,
  motivo,
  estado: 'PENDIENTE',
  creadoEn: '2026-11-01T12:00:00Z',
  actualizadoEn: '2026-11-01T12:00:00Z',
  publicacion: { id: publicacionId, titulo },
  autor: { id: 2, nombre: 'Beto' },
});

describe('AdminReportes (HU-06b)', () => {
  let fixture: ComponentFixture<AdminReportes>;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReportes],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminReportes);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;
  const titulos = () => [...pantalla().querySelectorAll('.reporte .titulo')].map((a) => a.textContent?.trim());

  function boton(texto: string, indice = 0): HTMLButtonElement {
    const botones = [...pantalla().querySelectorAll<HTMLButtonElement>('button')].filter((b) => b.textContent?.trim() === texto);
    return botones[indice];
  }

  async function responderListado(estado: string, reportes: ReporteModeracion[]) {
    http.expectOne((r) => r.url === `${api}/reportes` && r.params.get('estado') === estado).flush({ reportes });
    await fixture.whenStable();
  }

  it('al abrir pide los PENDIENTE y muestra publicación, motivo y quién denunció', async () => {
    await responderListado('PENDIENTE', [reporte(1, 10, 'Publicación dudosa'), reporte(2, 11, 'Otra', 'Es spam evidente')]);

    expect(titulos()).toEqual(['Publicación dudosa', 'Otra']);
    expect(pantalla().querySelector('.reporte .motivo')?.textContent).toContain('Contenido ofensivo');
    expect(pantalla().querySelector('.reporte .meta')?.textContent).toContain('Beto');
    expect(pantalla().querySelector('.reporte a')?.getAttribute('href')).toBe('/publicaciones/10');
  });

  it('sin reportes muestra un mensaje', async () => {
    await responderListado('PENDIENTE', []);

    expect(pantalla().textContent).toContain('No hay reportes pendientes');
  });

  it('cambiar de filtro pide los reportes de ese estado y no muestra acciones', async () => {
    await responderListado('PENDIENTE', []);

    boton('Descartados').click();
    await responderListado('DESCARTADO', [{ ...reporte(3, 12, 'Ya revisada'), estado: 'DESCARTADO' }]);

    expect(titulos()).toEqual(['Ya revisada']);
    expect(pantalla().querySelector('.acciones')).toBeNull();
    expect(boton('Descartados').getAttribute('aria-pressed')).toBe('true');
  });

  it('"Descartar" envía PATCH DESCARTADO y quita el reporte de la lista', async () => {
    await responderListado('PENDIENTE', [reporte(1, 10, 'Publicación dudosa'), reporte(2, 11, 'Otra')]);

    boton('Descartar').click();
    const solicitud = http.expectOne({ method: 'PATCH', url: `${api}/reportes/1` });
    expect(solicitud.request.body).toEqual({ estado: 'DESCARTADO' });
    solicitud.flush({ reporte: { ...reporte(1, 10, 'Publicación dudosa'), estado: 'DESCARTADO' } });
    await fixture.whenStable();

    expect(titulos()).toEqual(['Otra']);
    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('descartado');
  });

  it('"Marcar resuelto" envía PATCH RESUELTO', async () => {
    await responderListado('PENDIENTE', [reporte(1, 10, 'Publicación dudosa')]);

    boton('Marcar resuelto').click();
    const solicitud = http.expectOne({ method: 'PATCH', url: `${api}/reportes/1` });
    expect(solicitud.request.body).toEqual({ estado: 'RESUELTO' });
    solicitud.flush({ reporte: { ...reporte(1, 10, 'Publicación dudosa'), estado: 'RESUELTO' } });
    await fixture.whenStable();

    expect(titulos()).toEqual([]);
  });

  it('"Eliminar publicación" pide confirmación, borra la publicación y quita todos sus reportes', async () => {
    await responderListado('PENDIENTE', [
      reporte(1, 10, 'Publicación dudosa'),
      reporte(2, 10, 'Publicación dudosa', 'Es spam evidente'),
      reporte(3, 11, 'Otra'),
    ]);

    boton('Eliminar publicación').click();
    await fixture.whenStable();
    http.expectNone({ method: 'DELETE' });
    expect(pantalla().querySelector('.confirmar')?.textContent).toContain('todos sus reportes');

    boton('Sí, eliminar').click();
    http.expectOne({ method: 'DELETE', url: `${api}/publicaciones/10` }).flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(titulos()).toEqual(['Otra']);
    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('Se eliminó la publicación');
  });

  it('si una acción falla muestra el error en ese reporte y lo deja en la lista', async () => {
    await responderListado('PENDIENTE', [reporte(1, 10, 'Publicación dudosa')]);

    boton('Descartar').click();
    http.expectOne({ method: 'PATCH', url: `${api}/reportes/1` }).flush(
      { error: { codigo: 'NO_ENCONTRADO', mensaje: 'Reporte no encontrado' } },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    expect(titulos()).toEqual(['Publicación dudosa']);
    expect(pantalla().querySelector('.reporte [role="alert"]')?.textContent).toContain('Reporte no encontrado');
  });
});
