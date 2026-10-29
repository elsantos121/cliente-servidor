import { Routes } from '@angular/router';

// Las rutas protegidas usan requiereSesion(...roles) de core/auth.guard (a partir de HU-03 / HU-06a).
export const routes: Routes = [
  // Hasta HU-03 (listado de publicaciones) el inicio lleva al login.
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'registro',
    title: 'Crear cuenta · Foro universitario',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'login',
    title: 'Iniciar sesión · Foro universitario',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
];
