import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LogoutService } from '../../../services/services/logout';
import { Auth } from '../../../services/services/auth';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  constructor(readonly router: Router) {}

  private logoutService = inject(LogoutService);
  private auth = inject(Auth);

  readonly nombreUsuario = this.auth.getNombreUsuario();
  readonly esAdmin = this.auth.esAdministrador();

  /** ¿El usuario puede ver (consultar) el módulo indicado? */
  puedeVer(modulo: string): boolean {
    return this.auth.puedeConsultar(modulo);
  }

  logout(): void {
    this.logoutService.logout();
  }
}