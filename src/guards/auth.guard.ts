import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/services/auth';

/**
 * Guard de acceso a pantallas.
 *
 * - Si no hay sesión → redirige a /login.
 * - Si la ruta declara `data.modulo`, exige permiso de consulta sobre ese
 *   módulo (el Administrador siempre pasa). Si no lo tiene → /dashboard.
 * - Rutas sin `data.modulo` (p. ej. dashboard) solo requieren estar logueado.
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  const modulo = route.data?.['modulo'] as string | undefined;
  if (!modulo || auth.puedeConsultar(modulo)) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
