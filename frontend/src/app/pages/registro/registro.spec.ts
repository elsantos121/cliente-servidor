import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Registro } from './registro';

describe('Registro (HU-01)', () => {
  let fixture: ComponentFixture<Registro>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/auth/registro`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;

  function escribir(id: string, valor: string) {
    const input = pantalla().querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function enviar() {
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  async function completarValido() {
    escribir('nombre', 'Ana Pérez');
    escribir('email', 'ana@uni.edu');
    escribir('password', 'secreta123');
    await fixture.whenStable();
  }

  it('con el formulario vacío no llama a la API y muestra los errores de cada campo', async () => {
    await enviar();

    http.expectNone(url);
    const errores = [...pantalla().querySelectorAll('.error')].map((e) => e.textContent?.trim());
    expect(errores).toEqual([
      'El nombre es obligatorio',
      'El correo es obligatorio',
      'La contraseña es obligatoria',
    ]);
  });

  it('valida el correo y el largo mínimo de la contraseña antes de enviar', async () => {
    escribir('nombre', 'Ana');
    escribir('email', 'no-es-correo');
    escribir('password', 'corta');
    await enviar();

    http.expectNone(url);
    expect(pantalla().querySelector('#error-email')?.textContent).toContain('El correo no es válido');
    expect(pantalla().querySelector('#error-password')?.textContent).toContain('al menos 8 caracteres');
  });

  it('con datos válidos envía el registro y muestra la confirmación', async () => {
    await completarValido();
    await enviar();

    const solicitud = http.expectOne(url);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({ nombre: 'Ana Pérez', email: 'ana@uni.edu', password: 'secreta123' });

    solicitud.flush(
      { usuario: { id: 1, nombre: 'Ana Pérez', email: 'ana@uni.edu', rol: 'ESTUDIANTE', creadoEn: '2026-10-28T00:00:00Z' } },
      { status: 201, statusText: 'Created' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('¡Listo, Ana Pérez!');
    expect(pantalla().querySelector('form')).toBeNull();
  });

  it('si el correo ya está registrado (409) muestra el mensaje del servidor en el campo correo', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).flush(
      { error: { codigo: 'CONFLICTO', mensaje: 'El correo ya está registrado' } },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('#error-email')?.textContent).toContain('El correo ya está registrado');
  });

  it('si el servidor rechaza los datos (400) muestra el detalle de cada campo', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).flush(
      { error: { codigo: 'VALIDACION', mensaje: 'Datos inválidos', detalles: { nombre: 'El nombre no puede superar 100 caracteres' } } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('#error-nombre')?.textContent).toContain('no puede superar 100 caracteres');
  });

  it('si no hay conexión con la API muestra un aviso general', async () => {
    await completarValido();
    await enviar();

    http.expectOne(url).error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('No se pudo conectar con el servidor');
  });
});
