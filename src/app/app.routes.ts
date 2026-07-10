import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Inventario } from './inventario/inventario';
import { Quimico } from './quimico/quimico';
import { Temporada } from './temporada/temporada';
import { Rendimientos } from './rendimientos/rendimientos';
import { Asignaciones } from './asignaciones/asignaciones';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'inventario', component: Inventario },
  { path: 'quimico', component: Quimico },
  { path: 'temporada', component: Temporada },
  { path: 'rendimientos', component: Rendimientos },
  { path: 'asignaciones', component: Asignaciones },
];
