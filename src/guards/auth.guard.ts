import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/services/auth';
import { NotificacionService } from '../services/services/notificacion';

/**
 * Guard de acceso a pantallas.
 *
 * - Si no hay sesión → redirige a /login.
 * - Si hay token pero la sesión está incompleta (sin rol/permisos) → limpia y
 *   fuerza re-login, para no dejar al usuario con el menú vacío (P7).
 * - Si la ruta declara `data.modulo`, exige permiso de consulta sobre ese
 *   módulo (el Administrador siempre pasa). Si no lo tiene → /dashboard.
 * - Rutas sin `data.modulo` (p. ej. dashboard) solo requieren estar logueado.
 */
export const authGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const notificacion = inject(NotificacionService);

  if (!auth.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  // P7: token presente pero sesión sin rol/permisos → re-login limpio.
  if (!auth.sesionValida()) {
    auth.logout();
    notificacion.error('Tu sesión no es válida. Por favor inicia sesión de nuevo.');
    return router.parseUrl('/login');
  }

  const modulo = route.data?.['modulo'] as string | undefined;
  if (!modulo || auth.puedeConsultar(modulo)) {
    return true;
  }

  return router.parseUrl('/dashboard');
};
