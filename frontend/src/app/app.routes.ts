import { Routes } from '@angular/router';
import { requiereSesion } from './core/auth.guard';

// Las rutas protegidas usan requiereSesion(...roles): sin sesión llevan al login, con otro rol al inicio.
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
  {
    path: 'admin/categorias',
    title: 'Categorías · Foro universitario',
    canActivate: [requiereSesion('ADMIN')],
    loadComponent: () =>
      import('./pages/admin-categorias/admin-categorias').then((m) => m.AdminCategorias),
  },
];
