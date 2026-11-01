import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Denuncia } from './denuncia';

describe('Denuncia (HU-05)', () => {
  let fixture: ComponentFixture<Denuncia>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/publicaciones/5/reportes`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Denuncia],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Denuncia);
    fixture.componentRef.setInput('publicacionId', 5);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;

  async function abrir() {
    pantalla().querySelector<HTMLButtonElement>('.enlace-denuncia')!.click();
    await fixture.whenStable();
  }

  async function enviar(motivo: string) {
    const area = pantalla().querySelector<HTMLTextAreaElement>('#motivo-denuncia')!;
    area.value = motivo;
    area.dispatchEvent(new Event('input'));
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('al principio solo muestra el botón "Denunciar publicación"', () => {
    expect(pantalla().querySelector('.enlace-denuncia')?.textContent).toContain('Denunciar publicación');
    expect(pantalla().querySelector('form')).toBeNull();
  });

  it('el botón abre el formulario y "Cancelar" lo cierra', async () => {
    await abrir();
    expect(pantalla().querySelector('form')).toBeTruthy();

    pantalla().querySelector<HTMLButtonElement>('.boton--secundario')!.click();
    await fixture.whenStable();

    expect(pantalla().querySelector('form')).toBeNull();
  });

  it('valida el motivo (5–500) antes de enviar', async () => {
    await abrir();

    await enviar(' Malo ');

    http.expectNone(url);
    expect(pantalla().querySelector('#error-denuncia')?.textContent).toContain('entre 5 y 500');
  });

  it('envía la denuncia y agradece', async () => {
    await abrir();

    await enviar('  Contenido ofensivo ');
    const solicitud = http.expectOne({ method: 'POST', url });
    expect(solicitud.request.body).toEqual({ motivo: 'Contenido ofensivo' });
    solicitud.flush(
      { reporte: { id: 1, motivo: 'Contenido ofensivo', estado: 'PENDIENTE', creadoEn: '', publicacion: { id: 5, titulo: 'X' } } },
      { status: 201, statusText: 'Created' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('Tu denuncia quedó registrada');
    expect(pantalla().querySelector('form')).toBeNull();
  });

  it('si ya la había denunciado (409) lo informa sin mostrarlo como error', async () => {
    await abrir();

    await enviar('Contenido ofensivo');
    http.expectOne({ method: 'POST', url }).flush(
      { error: { codigo: 'CONFLICTO', mensaje: 'Ya denunciaste esta publicación' } },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('Ya denunciaste esta publicación');
    expect(pantalla().querySelector('.error')).toBeNull();
  });

  it('otros errores del servidor se muestran junto al campo', async () => {
    await abrir();

    await enviar('Contenido ofensivo');
    http.expectOne({ method: 'POST', url }).flush(
      { error: { codigo: 'NO_ENCONTRADO', mensaje: 'Publicación no encontrado' } },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('#error-denuncia')?.textContent).toContain('Publicación no encontrado');
  });
});
