import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Equivale al <script> de cada página que redirigía a ingreso.html si no había email. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() || inject(Router).createUrlTree(['/ingreso']);
};

/** El registro de usuarios solo está disponible para usuarios con ttp === 'ffp'. */
export const registroGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.puedeRegistrar() || inject(Router).createUrlTree(['/']);
};

/** Si ya hay sesión, la pantalla de ingreso lleva directamente al inicio. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.autenticado() || inject(Router).createUrlTree(['/']);
};
