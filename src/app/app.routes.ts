import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./placar/placar').then((m) => m.Placar) },
      {
        path: 'canarinho/:uid',
        loadComponent: () => import('./ficha/ficha').then((m) => m.Ficha),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
