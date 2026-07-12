import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LogoutService } from '../../../services/services/logout';
import { Auth } from '../../../services/services/auth';
import { InvernaderoService } from '../../../services/services/invernadero';
import { InvernaderoResponse } from '../../../interfaces/invernadero.interfaces';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  constructor(readonly router: Router) {}

  private logoutService    = inject(LogoutService);
  private auth             = inject(Auth);
  private invernaderoService = inject(InvernaderoService);

  readonly nombreUsuario     = this.auth.getNombreUsuario();
  readonly esAdmin           = this.auth.esAdministrador();

  readonly invernaderos        = signal<InvernaderoResponse[]>([]);
  readonly invernaderoActivoId = this.invernaderoService.invernaderoActivoId;

  reportesAbierto = false;
  adminAbierto    = false;

  ngOnInit(): void {
    this.invernaderoService.listar().subscribe(data => this.invernaderos.set(data));
  }

  puedeVer(modulo: string): boolean {
    return this.auth.puedeConsultar(modulo);
  }

  cambiarInvernadero(value: string): void {
    this.invernaderoService.setInvernaderoActivo(value === '' ? null : Number(value));
  }

  logout(): void {
    this.logoutService.logout();
  }
}
