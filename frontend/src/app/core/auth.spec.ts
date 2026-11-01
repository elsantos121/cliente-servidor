import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { requiereSesion } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { Usuario } from './modelos';
import { SesionService, tokenExpirado } from './sesion.service';

@Component({ template: '' })
class Vacia {}

const estudiante: Usuario = { id: 1, nombre: 'Ana', email: 'ana@uni.edu', rol: 'ESTUDIANTE', creadoEn: '' };
const admin: Usuario = { ...estudiante, id: 2, rol: 'ADMIN' };

/** JWT de prueba sin firma real: el frontend solo lee "exp". */
function tokenQueVence(segundosDesdeAhora: number): string {
  const contenido = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + segundosDesdeAhora }));
  return `cabecera.${contenido}.firma`;
}

beforeEach(() => localStorage.clear());

describe('SesionService (HU-02)', () => {
  it('guarda la sesión y la recupera al recargar si el token no venció', () => {
    const token = tokenQueVence(3600);
    TestBed.inject(SesionService).iniciar({ token, usuario: estudiante });

    TestBed.resetTestingModule();
    const recargada = TestBed.inject(SesionService);

    expect(recargada.token()).toBe(token);
    expect(recargada.usuario()?.email).toBe('ana@uni.edu');
  });

  it('descarta al recargar una sesión cuyo token ya venció', () => {
    TestBed.inject(SesionService).iniciar({ token: tokenQueVence(-60), usuario: estudiante });

    TestBed.resetTestingModule();

    expect(TestBed.inject(SesionService).autenticado()).toBe(false);
  });

  it('tokenExpirado considera vencido un token ilegible', () => {
    expect(tokenExpirado('no-es-un-jwt')).toBe(true);
    expect(tokenExpirado(tokenQueVence(60))).toBe(false);
  });
});

describe('authInterceptor (HU-02)', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let sesion: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: Vacia }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    sesion = TestBed.inject(SesionService);
  });

  afterEach(() => backend.verify());

  it('agrega el token a las solicitudes a la API', () => {
    sesion.iniciar({ token: 'a.b.c', usuario: estudiante });

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe();

    expect(backend.expectOne(`${environment.apiUrl}/usuarios/me`).request.headers.get('Authorization')).toBe('Bearer a.b.c');
  });

  it('no envía el token a otros sitios', () => {
    sesion.iniciar({ token: 'a.b.c', usuario: estudiante });

    http.get('https://otro-sitio.com/datos').subscribe();

    expect(backend.expectOne('https://otro-sitio.com/datos').request.headers.has('Authorization')).toBe(false);
  });

  it('sin sesión no agrega el header', () => {
    http.get(`${environment.apiUrl}/categorias`).subscribe();

    expect(backend.expectOne(`${environment.apiUrl}/categorias`).request.headers.has('Authorization')).toBe(false);
  });

  it('si la API responde 401 cierra la sesión y lleva al login', async () => {
    sesion.iniciar({ token: 'a.b.c', usuario: estudiante });
    const router = TestBed.inject(Router);

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/usuarios/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    await new Promise((listo) => setTimeout(listo)); // deja terminar la navegación

    expect(sesion.autenticado()).toBe(false);
    expect(router.url.startsWith('/login')).toBe(true);
    // Fase 4: el login necesita saber por qué llegó el usuario para explicárselo.
    expect(router.parseUrl(router.url).queryParamMap.get('motivo')).toBe('sesion-expirada');
  });
});

describe('requiereSesion (HU-02)', () => {
  function ejecutar(...roles: Parameters<typeof requiereSesion>) {
    return TestBed.runInInjectionContext(() =>
      requiereSesion(...roles)({} as never, { url: '/admin/categorias' } as never),
    );
  }

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('sin sesión redirige al login recordando la página pedida', () => {
    const resultado = ejecutar('ADMIN') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/login?volver=%2Fadmin%2Fcategorias');
  });

  it('con un rol no permitido redirige al inicio', () => {
    TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario: estudiante });

    const resultado = ejecutar('ADMIN') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/');
  });

  it('con el rol permitido deja pasar', () => {
    TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario: admin });

    expect(ejecutar('ADMIN')).toBe(true);
  });

  it('sin roles indicados alcanza con estar autenticado', () => {
    TestBed.inject(SesionService).iniciar({ token: 'a.b.c', usuario: estudiante });

    expect(ejecutar()).toBe(true);
  });
});
