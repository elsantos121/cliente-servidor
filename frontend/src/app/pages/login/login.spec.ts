import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SesionService } from '../../core/sesion.service';
import { Login } from './login';

const usuario = { id: 1, nombre: 'Ana Pérez', email: 'ana@uni.edu', rol: 'ESTUDIANTE' as const, creadoEn: '2026-10-28T00:00:00Z' };

describe('Login (HU-02)', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let router: Router;
  const url = `${environment.apiUrl}/auth/login`;

  async function crear(rutaInicial = '/login') {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: Login }]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    await router.navigateByUrl(rutaInicial);
    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  const pantalla = () => fixture.nativeElement as HTMLElement;

  function escribir(id: string, valor: string) {
    const input = pantalla().querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function enviarCredenciales(email = 'ana@uni.edu', password = 'secreta123') {
    escribir('email', email);
    escribir('password', password);
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('con el formulario vacío no llama a la API y marca los campos obligatorios', async () => {
    await crear();
    pantalla().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    http.expectNone(url);
    expect(pantalla().querySelector('#error-email')?.textContent).toContain('obligatorio');
    expect(pantalla().querySelector('#error-password')?.textContent).toContain('obligatoria');
  });

  it('con credenciales válidas guarda la sesión y vuelve a la página pedida', async () => {
    await crear('/login?volver=%2Fpublicaciones%2Fnueva');
    await enviarCredenciales();

    const solicitud = http.expectOne(url);
    expect(solicitud.request.body).toEqual({ email: 'ana@uni.edu', password: 'secreta123' });
    solicitud.flush({ token: 'a.b.c', usuario });
    await fixture.whenStable();

    const sesion = TestBed.inject(SesionService);
    expect(sesion.token()).toBe('a.b.c');
    expect(sesion.usuario()?.nombre).toBe('Ana Pérez');
    expect(router.url).toBe('/publicaciones/nueva');
  });

  it('no redirige fuera del sitio aunque ?volver apunte a otro dominio', async () => {
    await crear('/login?volver=%2F%2Fmalicioso.com');
    await enviarCredenciales();

    http.expectOne(url).flush({ token: 'a.b.c', usuario });
    await fixture.whenStable();

    expect(router.url).toBe('/');
  });

  it('con credenciales incorrectas (401) muestra el mensaje genérico del servidor', async () => {
    await crear();
    await enviarCredenciales('ana@uni.edu', 'incorrecta');

    http.expectOne(url).flush(
      { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Correo o contraseña incorrectos' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="alert"]')?.textContent).toContain('Correo o contraseña incorrectos');
    expect(TestBed.inject(SesionService).autenticado()).toBe(false);
  });

  it('con la sesión iniciada muestra el usuario y permite cerrarla', async () => {
    await crear();
    TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario });
    await fixture.whenStable();

    expect(pantalla().querySelector('[role="status"]')?.textContent).toContain('Ana Pérez');
    pantalla().querySelector<HTMLButtonElement>('.boton--secundario')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(SesionService).autenticado()).toBe(false);
    expect(pantalla().querySelector('form')).toBeTruthy();
  });
});
