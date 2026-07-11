import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Inventario } from './inventario/inventario';
import { Quimico } from './quimico/quimico';
import { Temporada } from './temporada/temporada';
import { Rendimientos } from './rendimientos/rendimientos';
import { Asignaciones } from './asignaciones/asignaciones';
import { Anuncios } from './anuncios/anuncios';
import { Usuarios } from './usuarios/usuarios';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Público
  { path: 'login', component: Login },

  // Home de cualquier usuario autenticado (sin restricción de módulo)
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  // Pantallas gobernadas por permiso de módulo (rol → permiso.consultar)
  { path: 'inventario', component: Inventario, canActivate: [authGuard], data: { modulo: 'Inventario' } },
  { path: 'quimico', component: Quimico, canActivate: [authGuard], data: { modulo: 'Quimico' } },
  { path: 'temporada', component: Temporada, canActivate: [authGuard], data: { modulo: 'Temporada' } },
  { path: 'rendimientos', component: Rendimientos, canActivate: [authGuard], data: { modulo: 'Rendimientos' } },
  { path: 'anuncios', component: Anuncios, canActivate: [authGuard], data: { modulo: 'Anuncios' } },
  { path: 'asignaciones', component: Asignaciones, canActivate: [authGuard], data: { modulo: 'Asignaciones' } },
  { path: 'usuarios', component: Usuarios, canActivate: [authGuard], data: { modulo: 'Usuarios' } },
];
