import { Routes } from '@angular/router';
import { requiereSesion } from './core/auth.guard';

// Las rutas protegidas usan requiereSesion(...roles): sin sesión llevan al login, con otro rol al inicio.
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Foro universitario',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
  },
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
  // "nueva" va antes de ":id" para que no se lea como un id.
  {
    path: 'publicaciones/nueva',
    title: 'Nueva publicación · Foro universitario',
    canActivate: [requiereSesion()],
    loadComponent: () => import('./pages/publicacion-form/publicacion-form').then((m) => m.PublicacionForm),
  },
  {
    path: 'publicaciones/:id',
    title: 'Publicación · Foro universitario',
    loadComponent: () =>
      import('./pages/publicacion-detalle/publicacion-detalle').then((m) => m.PublicacionDetalle),
  },
  {
    path: 'publicaciones/:id/editar',
    title: 'Editar publicación · Foro universitario',
    canActivate: [requiereSesion()],
    loadComponent: () => import('./pages/publicacion-form/publicacion-form').then((m) => m.PublicacionForm),
  },
  {
    path: 'admin/categorias',
    title: 'Categorías · Foro universitario',
    canActivate: [requiereSesion('ADMIN')],
    loadComponent: () =>
      import('./pages/admin-categorias/admin-categorias').then((m) => m.AdminCategorias),
  },
  {
    path: 'admin/reportes',
    title: 'Reportes · Foro universitario',
    canActivate: [requiereSesion('ADMIN')],
    loadComponent: () => import('./pages/admin-reportes/admin-reportes').then((m) => m.AdminReportes),
  },
  { path: '**', redirectTo: '' },
];
