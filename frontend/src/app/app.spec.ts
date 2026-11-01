import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { App } from './app';
import { SesionService } from './core/sesion.service';

@Component({ template: '' })
class Vacia {}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([{ path: '**', component: Vacia }]), provideHttpClient()],
    }).compileComponents();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('sin sesión muestra los enlaces para iniciar sesión y crear cuenta', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;
    expect(compilado.querySelector('.marca')?.textContent).toContain('Foro universitario');
    expect(compilado.querySelector('nav a[href="/login"]')).toBeTruthy();
    expect(compilado.querySelector('nav a[href="/registro"]')).toBeTruthy();
  });

  it('con sesión de administrador muestra el nombre, la etiqueta admin y cerrar sesión', async () => {
    TestBed.inject(SesionService).iniciar({
      token: 'a.b.c',
      usuario: { id: 2, nombre: 'Administrador', email: 'admin@uni.edu', rol: 'ADMIN', creadoEn: '' },
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.querySelector('.usuario')?.textContent).toContain('Administrador');
    expect(compilado.querySelector('.etiqueta')?.textContent).toContain('admin');
    compilado.querySelector<HTMLButtonElement>('.enlace')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(SesionService).autenticado()).toBe(false);
  });
});
