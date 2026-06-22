import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LogoutService } from '../../../services/services/logout';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  constructor(readonly router: Router) {}

  private logoutService = inject(LogoutService);

  logout(): void {
    this.logoutService.logout();
  }
}