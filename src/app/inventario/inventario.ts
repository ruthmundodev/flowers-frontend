import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../shared/sidebar/sidebar';
import { InventarioService } from '../../services/services/inventario';
import { InventarioItem } from '../../interfaces/inventario.interfaces';
import { NotificacionService } from '../../services/services/notificacion';
import { VariedadService } from '../../services/services/variedad';
import { InvernaderoService } from '../../services/services/invernadero';
import { VariedadRequest } from '../../interfaces/variedad.interfaces';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';
import { PuedeDirective } from '../../directives/puede.directive';

export interface Semilla {
  variedadId: number;
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
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, PuedeDirective],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss',
})
export class Inventario implements OnInit {

  busqueda = '';
  cargando = true;
  error = false;
  semillas: Semilla[] = [];

  // Vista del inventario del invernadero: Semillas o Polen (variedad.tipo).
  tipoVista: 'SEMILLA' | 'POLEN' = 'SEMILLA';

  // ── Modal "Agregar variedad" ────────────────────────────────
  mostrarModal = false;
  guardando = false;
  errorForm = '';
  invernaderos: InvernaderoResponse[] = [];
  form: VariedadRequest = this.formVacio();

  // Tipos vienen de la tabla variedad (endpoint). "__OTRO__" abre input libre.
  tiposInventario: string[] = ['SEMILLA'];
  readonly OTRO = '__OTRO__';
  tipoSel = 'SEMILLA';
  tipoOtro = '';
  editandoId: number | null = null;

  constructor(
    private inventarioService: InventarioService,
    private variedadService: VariedadService,
    private invernaderoService: InvernaderoService,
    private cdr: ChangeDetectorRef,
    private notificacion: NotificacionService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(tipo: 'SEMILLA' | 'POLEN'): void {
    if (this.tipoVista === tipo) return;
    this.tipoVista = tipo;
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.inventarioService.listar(this.tipoVista).subscribe({
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

  // ── Modal ───────────────────────────────────────────────────
  abrirModal(): void {
    this.editandoId = null;
    this.form = this.formVacio();
    this.tipoSel = this.tipoVista;
    this.tipoOtro = '';
    this.errorForm = '';
    this.mostrarModal = true;
    this.cargarCatalogosModal();
  }

  editar(s: Semilla): void {
    this.editandoId = s.variedadId;
    this.form = this.formVacio();
    this.tipoOtro = '';
    this.errorForm = '';
    this.mostrarModal = true;
    this.cargarCatalogosModal();

    this.variedadService.buscar(s.variedadId).subscribe({
      next: (v) => {
        const tipo = v.tipo ?? 'SEMILLA';
        this.form = {
          nombre: v.nombre ?? '',
          descripcion: v.descripcion ?? '',
          numeroBass: v.numeroBass,
          fechaInicio: v.fechaInicio ? v.fechaInicio.substring(0, 10) : null,
          fechaPoda: v.fechaPoda ? v.fechaPoda.substring(0, 10) : null,
          invernaderoId: v.invernaderoId,
          parental: v.parental ?? '',
          tipo,
        };
        if (!this.tiposInventario.includes(tipo)) {
          this.tiposInventario = [...this.tiposInventario, tipo];
        }
        this.tipoSel = tipo;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorForm = err?.error?.message || 'No se pudo cargar la variedad.';
        this.cdr.markForCheck();
      },
    });
  }

  private cargarCatalogosModal(): void {
    this.variedadService.tipos().subscribe({
      next: (tipos) => {
        const lista = tipos.length ? [...tipos] : ['SEMILLA'];
        if (this.tipoSel && this.tipoSel !== this.OTRO && !lista.includes(this.tipoSel)) {
          lista.push(this.tipoSel);
        }
        this.tiposInventario = lista;
        this.cdr.markForCheck();
      },
      error: () => { this.cdr.markForCheck(); },
    });

    if (this.invernaderos.length === 0) {
      this.invernaderoService.listar().subscribe({
        next: (data) => {
          this.invernaderos = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificacion.error('No se pudieron cargar los invernaderos');
          this.cdr.markForCheck();
        },
      });
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.errorForm = '';
  }

  guardarVariedad(): void {
    if (!this.form.nombre?.trim() || this.form.numeroBass == null ||
        !this.form.fechaInicio || this.form.invernaderoId == null) {
      this.errorForm = 'Nombre, número bass, fecha de inicio e invernadero son obligatorios.';
      return;
    }

    // Resolver tipo: opción del selector o valor libre de "Otro".
    const tipo = this.tipoSel === this.OTRO ? this.tipoOtro.trim().toUpperCase() : this.tipoSel;
    if (!tipo) {
      this.errorForm = 'Especifica el tipo de inventario.';
      return;
    }
    this.form.tipo = tipo;

    this.guardando = true;
    this.errorForm = '';

    const editando = this.editandoId != null;
    const peticion = editando
      ? this.variedadService.actualizar(this.editandoId as number, this.form)
      : this.variedadService.guardar(this.form);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.notificacion.exito(editando ? 'Variedad actualizada correctamente' : 'Variedad agregada correctamente');
        this.cargar();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorForm = err?.error?.message || 'Error al guardar. Intenta de nuevo.';
        this.guardando = false;
        this.notificacion.error(editando ? 'Error al actualizar la variedad' : 'Error al guardar la variedad');
        this.cdr.markForCheck();
      },
    });
  }

  private formVacio(): VariedadRequest {
    return {
      nombre: '',
      descripcion: '',
      numeroBass: null,
      fechaInicio: null,
      fechaPoda: null,
      invernaderoId: null,
      parental: '',
      tipo: 'SEMILLA',
    };
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
      variedadId:   item.variedadId,
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
