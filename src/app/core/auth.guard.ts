import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// inject() só funciona antes do primeiro await (depois disso o contexto de injeção já foi embora).
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const login = inject(Router).createUrlTree(['/login']);
  await auth.pronto;
  return auth.perfil() ? true : login;
};

export const visitanteGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const inicio = inject(Router).createUrlTree(['/']);
  await auth.pronto;
  return auth.perfil() ? inicio : true;
};
