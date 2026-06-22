import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Sidebar } from '../shared/sidebar/sidebar';
import { DashboardService } from '../../services/services/dashboard';
import { CosechaMes, DashboardCultivo, DashboardStats } from '../../interfaces/dashboard.interfaces';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  stats: DashboardStats = {
    cultivosActivos: 0,
    totalVariedades: 0,
    stockTotalKg: 0,
    variedadesStockBajo: 0,
    proximaCosecha: null,
  };

  cultivosActivos: DashboardCultivo[] = [];
  cosechasMes: CosechaMes[] = [];
  maxKg = 1;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin({
      stats:    this.dashboardService.getStats().pipe(catchError(() => of(null))),
      cultivos: this.dashboardService.getCultivosActivos().pipe(catchError(() => of([]))),
      cosechas: this.dashboardService.getCosechasPorMes().pipe(catchError(() => of([]))),
    }).subscribe(({ stats, cultivos, cosechas }) => {
      if (stats) this.stats = stats;
      this.cultivosActivos = cultivos ?? [];
      this.cosechasMes     = cosechas ?? [];
      this.maxKg = Math.max(...this.cosechasMes.map(c => Number(c.totalKg)), 1);
      this.cdr.markForCheck();
    });
  }

  getIcono(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('maíz') || n.includes('maiz'))      return '🌽';
    if (n.includes('chile') || n.includes('pimiento')) return '🌶️';
    if (n.includes('frijol'))                          return '🫘';
    if (n.includes('tomate'))                          return '🍅';
    if (n.includes('lechuga'))                         return '🥬';
    if (n.includes('zanahoria'))                       return '🥕';
    return '🌱';
  }

  formatFechaCosecha(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  }

  formatProximaCosecha(date: string | null | undefined): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  barHeight(kg: number): number {
    return this.maxKg > 0 ? Math.round((Number(kg) / this.maxKg) * 100) : 0;
  }

  estadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'En crecimiento': 'badge--green',
      'Lista cosecha':  'badge--lime',
    };
    return map[estado] ?? 'badge--green';
  }

  progClass(nivelPct: number): string {
    if (nivelPct <= 10) return 'progress-fill--danger';
    if (nivelPct <= 30) return 'progress-fill--warn';
    return '';
  }
}
