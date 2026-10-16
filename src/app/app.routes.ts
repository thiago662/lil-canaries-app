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
      { path: 'senha', loadComponent: () => import('./senha/senha').then((m) => m.Senha) },
      { path: 'apelidos', loadComponent: () => import('./apelidos/apelidos').then((m) => m.Apelidos) },
      {
        path: 'canarinho/:uid',
        loadComponent: () => import('./ficha/ficha').then((m) => m.Ficha),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
