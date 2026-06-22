import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { InventarioService } from '../../services/services/inventario';
import { InventarioItem } from '../../interfaces/inventario.interfaces';
import { NotificacionService } from '../../services/services/notificacion';

export interface Semilla {
  icono: string;
  iconoBg: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  stock: number;
  nivel: number;
  ultimaSiembra: string;
  estado: 'Normal' | 'Moderado' | 'Crítico' | 'Sin sembrar';
}

@Component({
  selector: 'app-inventario',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss',
})
export class Inventario implements OnInit {

  busqueda = '';
  cargando = true;
  error = false;
  semillas: Semilla[] = [];

  constructor(
    private inventarioService: InventarioService,
    private cdr: ChangeDetectorRef,
    private notificacion: NotificacionService,
  ) {}

  ngOnInit(): void {
    this.inventarioService.listar().subscribe({
      next: (items) => {
        this.semillas = items.map(item => this.mapToSemilla(item));
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.notificacion.error('Error al cargar el inventario');
        this.cdr.markForCheck();
      }
    });
  }

  private mapToSemilla(item: InventarioItem): Semilla {
    const estadoMap: Record<string, Semilla['estado']> = {
      'Alto':     'Normal',
      'Medio':    'Moderado',
      'Bajo':     'Crítico',
      'Sin stock': 'Sin sembrar',
    };

    const ultimaSiembra = item.ultimaSiembra
      ? new Date(item.ultimaSiembra).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
      : '—';

    return {
      icono:        this.getIcono(item.variedad),
      iconoBg:      this.getIconoBg(item.nivel),
      nombre:       item.variedad,
      descripcion:  item.descripcion ?? '',
      tipo:         item.tipo ?? 'Sin tipo',
      stock:        Number(item.stockKg),
      nivel:        item.nivelPct ?? 0,
      ultimaSiembra,
      estado:       estadoMap[item.nivel] ?? 'Sin sembrar',
    };
  }

  private getIcono(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('maíz') || n.includes('maiz'))       return '🌽';
    if (n.includes('chile') || n.includes('pimiento'))  return '🌶️';
    if (n.includes('frijol'))                           return '🫘';
    if (n.includes('tomate'))                           return '🍅';
    if (n.includes('lechuga'))                          return '🥬';
    if (n.includes('zanahoria'))                        return '🥕';
    if (n.includes('papa') || n.includes('potato'))     return '🥔';
    if (n.includes('cebolla'))                          return '🧅';
    if (n.includes('ajo'))                              return '🧄';
    return '🌱';
  }

  private getIconoBg(nivel: string): string {
    const map: Record<string, string> = {
      'Alto':     '#EAF3DE',
      'Medio':    '#FAEEDA',
      'Bajo':     '#FCEBEB',
      'Sin stock': '#f0ede6',
    };
    return map[nivel] ?? '#EAF3DE';
  }

  get semillasFiltradas(): Semilla[] {
    if (!this.busqueda) return this.semillas;
    const q = this.busqueda.toLowerCase();
    return this.semillas.filter(s =>
      s.nombre.toLowerCase().includes(q) ||
      s.tipo.toLowerCase().includes(q)
    );
  }

  get totalVariedades(): number  { return this.semillas.length; }
  get conStockActivo(): number   { return this.semillas.filter(s => s.stock > 0).length; }
  get kgTotales(): number        { return Math.round(this.semillas.reduce((acc, s) => acc + s.stock, 0)); }
  get stockCritico(): number     { return this.semillas.filter(s => s.estado === 'Crítico').length; }
  get reasastoPendiente(): number {
    return this.semillas.filter(s => s.estado === 'Crítico' || s.estado === 'Sin sembrar').length;
  }

  badgeClass(estado: string): string {
    const map: Record<string, string> = {
      'Normal':      'badge--green',
      'Moderado':    'badge--yellow',
      'Crítico':     'badge--red',
      'Sin sembrar': 'badge--gray',
    };
    return map[estado] ?? 'badge--gray';
  }

  progClass(nivel: number): string {
    if (nivel <= 10) return 'prog-fill--danger';
    if (nivel <= 30) return 'prog-fill--warn';
    return '';
  }

  pctClass(nivel: number): string {
    return nivel <= 10 ? 'prog-pct--danger' : '';
  }

  stockClass(estado: string): string {
    return estado === 'Crítico' ? 'stock-val--crit' : '';
  }
}
