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
    loadComponent: () => import('./ficha/ficha').then((m) => m.Ficha),
  },
  { path: '**', redirectTo: '' },
];
