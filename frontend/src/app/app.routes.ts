import { Routes } from '@angular/router';

export const routes: Routes = [
  // Hasta HU-03 (listado de publicaciones) el inicio lleva al registro.
  { path: '', pathMatch: 'full', redirectTo: 'registro' },
  {
    path: 'registro',
    title: 'Crear cuenta · Foro universitario',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
];
