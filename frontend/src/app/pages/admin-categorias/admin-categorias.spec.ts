import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AdminCategorias } from './admin-categorias';

describe('AdminCategorias (HU-06a)', () => {
  let fixture: ComponentFixture<AdminCategorias>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/categorias`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategorias],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCategorias);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;
  const nombres = () => [...pantalla().querySelectorAll('.lista li')].map((li) => li.textContent?.trim());

  async function responderListado(categorias: { id: number; nombre: string }[]) {
    http.expectOne(url).flush({ categorias: categorias.map((c) => ({ ...c, creadoEn: '' })) });
    await fixture.whenStable();
  }

  async function crear(nombre: string) {
    const input = pantalla().querySelector<HTMLInputElement>('#nombre-categoria')!;
    input.value = nombre;
    input.dispatchEvent(new Event('input'));
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('muestra "Cargando" y después las categorías del servidor', async () => {
    expect(pantalla().textContent).toContain('Cargando categorías');

    await responderListado([{ id: 1, nombre: 'Física' }, { id: 2, nombre: 'Matemática' }]);

    expect(nombres()).toEqual(['Física', 'Matemática']);
  });

  it('sin categorías muestra un mensaje', async () => {
    await responderListado([]);

    expect(pantalla().textContent).toContain('Todavía no hay categorías');
  });

  it('si falla la carga muestra el error y permite reintentar', async () => {
    http.expectOne(url).flush(null, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    pantalla().querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await responderListado([{ id: 1, nombre: 'Física' }]);

    expect(nombres()).toEqual(['Física']);
  });

  it('valida el nombre antes de enviar', async () => {
    await responderListado([]);

    await crear(' A ');

    http.expectNone({ method: 'POST', url });
    expect(pantalla().querySelector('#error-categoria')?.textContent).toContain('entre 2 y 50');
  });

  it('crea una categoría, la agrega en orden y limpia el campo', async () => {
    await responderListado([{ id: 1, nombre: 'Física' }, { id: 2, nombre: 'Programación' }]);

    await crear('  Matemática ');
    const solicitud = http.expectOne({ method: 'POST', url });
    expect(solicitud.request.body).toEqual({ nombre: 'Matemática' });
    solicitud.flush({ categoria: { id: 3, nombre: 'Matemática', creadoEn: '' } }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();

    expect(nombres()).toEqual(['Física', 'Matemática', 'Programación']);
    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('Matemática');
    expect(pantalla().querySelector<HTMLInputElement>('#nombre-categoria')!.value).toBe('');
  });

  it('si el nombre ya existe (409) muestra el mensaje del servidor junto al campo', async () => {
    await responderListado([{ id: 1, nombre: 'Física' }]);

    await crear('física');
    http.expectOne({ method: 'POST', url }).flush(
      { error: { codigo: 'CONFLICTO', mensaje: 'Ya existe una categoría con ese nombre' } },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('#error-categoria')?.textContent).toContain('Ya existe una categoría');
    expect(nombres()).toEqual(['Física']);
  });
});
