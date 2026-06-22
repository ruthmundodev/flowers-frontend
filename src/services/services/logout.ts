import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth';
import { NotificacionService } from './notificacion';

@Injectable({ providedIn: 'root' })
export class LogoutService {
  private auth = inject(Auth);
  private router = inject(Router);
  private notificacion = inject(NotificacionService);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.notificacion.info('Sesión cerrada correctamente');
  }
}
