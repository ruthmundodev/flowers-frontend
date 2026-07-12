import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/services/auth';

/**
 * Guard de acceso a pantallas.
 *
 * - Sin sesión → /login.
 * - Token presente pero sesión incompleta (P7) → logout + /login?sesionInvalida=1.
 * - Con `data.modulo` → exige permiso; sin permiso → /dashboard.
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  if (!auth.sesionValida()) {
    auth.logout();
    return router.parseUrl('/login?sesionInvalida=1');
  }

  const modulo = route.data?.['modulo'] as string | undefined;
  if (!modulo || auth.puedeConsultar(modulo)) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
