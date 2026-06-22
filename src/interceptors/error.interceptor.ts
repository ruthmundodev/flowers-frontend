import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/services/auth';
import { NotificacionService } from '../services/services/notificacion';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const notificacion = inject(NotificacionService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        notificacion.error('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
