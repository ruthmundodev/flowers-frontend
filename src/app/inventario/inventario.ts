import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss',
})
export class Inventario {

  busqueda = '';

  semillas: Semilla[] = [
    { icono: '🌽', iconoBg: '#EAF3DE', nombre: 'Maíz criollo blanco',   descripcion: 'Heirloom · Local',       tipo: 'Grano',    stock: 62,  nivel: 62, ultimaSiembra: '12 ene', estado: 'Normal'      },
    { icono: '🌶️', iconoBg: '#FAEEDA', nombre: 'Chile pimiento rojo',    descripcion: 'Híbrido F1 · Importado', tipo: 'Hortaliza', stock: 28,  nivel: 28, ultimaSiembra: '5 feb',  estado: 'Moderado'    },
    { icono: '🫘', iconoBg: '#EAF3DE', nombre: 'Frijol negro criollo',   descripcion: 'Heirloom · Local',       tipo: 'Legumbre',  stock: 145, nivel: 90, ultimaSiembra: '20 ene', estado: 'Normal'      },
    { icono: '🍅', iconoBg: '#FCEBEB', nombre: 'Tomate manzano',         descripcion: 'Híbrido · Importado',    tipo: 'Hortaliza', stock: 6,   nivel: 6,  ultimaSiembra: '3 mar',  estado: 'Crítico'     },
    { icono: '🥬', iconoBg: '#f0ede6', nombre: 'Lechuga romana',         descripcion: 'Híbrido · Local',        tipo: 'Hortaliza', stock: 18,  nivel: 18, ultimaSiembra: '—',      estado: 'Sin sembrar' },
    { icono: '🥕', iconoBg: '#EAF3DE', nombre: 'Zanahoria chantenay',    descripcion: 'Híbrido · Importado',    tipo: 'Raíz',      stock: 54,  nivel: 54, ultimaSiembra: '15 feb', estado: 'Normal'      },
  ];

  get semillasFiltradas(): Semilla[] {
    if (!this.busqueda) return this.semillas;
    const q = this.busqueda.toLowerCase();
    return this.semillas.filter(s =>
      s.nombre.toLowerCase().includes(q) ||
      s.tipo.toLowerCase().includes(q)
    );
  }

  get totalVariedades(): number { return this.semillas.length; }
  get kgTotales(): number { return this.semillas.reduce((acc, s) => acc + s.stock, 0); }
  get stockCritico(): number { return this.semillas.filter(s => s.estado === 'Crítico').length; }
  get reasastoPendiente(): number { return 1; }

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