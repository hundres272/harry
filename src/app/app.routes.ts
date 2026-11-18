import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, registroGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: 'ingreso',
    title: 'Ingreso Hundres Series',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/ingreso/ingreso').then((m) => m.Ingreso),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Inicio',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'serie/:nombreSerie',
    title: 'Hundres Series',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reproductor/reproductor').then((m) => m.Reproductor),
  },
  {
    path: 'registro',
    title: 'Registro Hundres Series',
    canActivate: [authGuard, registroGuard],
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },

  // Compatibilidad con las URLs de la versión HTML (marcadores / enlaces antiguos).
  {
    path: 'index.html',
    redirectTo: ({ queryParams }) =>
      queryParams['nombreSerie'] ? `/serie/${queryParams['nombreSerie']}` : '/',
  },
  { path: 'indexSeriesAll.html', redirectTo: '' },
  { path: 'entrada.html', redirectTo: '' },
  { path: 'ingreso.html', redirectTo: 'ingreso' },
  { path: 'registro.html', redirectTo: 'registro' },
  { path: '**', redirectTo: '' },
];
