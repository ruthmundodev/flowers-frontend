import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { LogoutService } from '../../../services/services/logout';
import { Auth } from '../../../services/services/auth';
import { InvernaderoService } from '../../../services/services/invernadero';
import { DashboardService } from '../../../services/services/dashboard';
import { InvernaderoResponse } from '../../../interfaces/invernadero.interfaces';
import { ThemeService } from '../../../services/services/theme';
import { Campana } from '../campana/campana';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, Campana],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  private logoutService      = inject(LogoutService);
  private auth               = inject(Auth);
  private invernaderoService = inject(InvernaderoService);
  private dashboardService   = inject(DashboardService);
  readonly tema              = inject(ThemeService);

  readonly nombreUsuario     = this.auth.getNombreUsuario();
  readonly esAdmin           = this.auth.esAdministrador();

  readonly invernaderos        = signal<InvernaderoResponse[]>([]);
  readonly invernaderoActivoId = this.invernaderoService.invernaderoActivoId;

  // Badge de Inventario = variedades con stock bajo del invernadero activo.
  // Se recalcula al cambiar de invernadero; si es 0 el badge no se muestra.
  readonly stockBajo = signal<number>(0);

  constructor(readonly router: Router) {
    toObservable(this.invernaderoService.invernaderoActivoId)
      .pipe(
        switchMap(id => this.dashboardService.getStats(id).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe(stats => this.stockBajo.set(stats?.variedadesStockBajo ?? 0));
  }

  reportesAbierto = false;
  adminAbierto    = false;
  mobileOpen      = false;

  readonly invSelectorOpen  = signal(false);
  readonly highlightedIndex = signal(0);

  @ViewChild('invWrapper') private invWrapper?: ElementRef<HTMLElement>;
  @ViewChild('invTrigger') private invTrigger?: ElementRef<HTMLButtonElement>;

  readonly invOpciones = computed(() => [
    { id: null as number | null, numero: null as number | null, nombreCultivo: 'Todos los invernaderos' },
    ...this.invernaderos().map(inv => ({ id: inv.id, numero: inv.numero, nombreCultivo: inv.nombreCultivo })),
  ]);

  readonly invActivo = computed(() => {
    const id = this.invernaderoActivoId();
    if (id === null) return { label: 'Todos', sub: null as string | null };
    const inv = this.invernaderos().find(i => i.id === id);
    return inv ? { label: `#${inv.numero}`, sub: inv.nombreCultivo } : { label: 'Todos', sub: null };
  });

  private static readonly RUTAS_REPORTES = ['/rendimientos', '/parcelas', '/exportar'];
  private static readonly RUTAS_ADMIN    = ['/usuarios', '/invernaderos', '/asignaciones'];

  ngOnInit(): void {
    this.invernaderoService.listar().subscribe(data => this.invernaderos.set(data));
    const url = this.router.url;
    this.reportesAbierto = Sidebar.RUTAS_REPORTES.some(r => url.startsWith(r));
    this.adminAbierto    = Sidebar.RUTAS_ADMIN.some(r => url.startsWith(r));
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

  toggleInvSelector(): void {
    this.invSelectorOpen() ? this.closeInvSelector(false) : this.openInvSelector();
  }

  openInvSelector(): void {
    this.syncHighlighted();
    this.invSelectorOpen.set(true);
    setTimeout(() => this.focusHighlighted());
  }

  closeInvSelector(focusTrigger: boolean): void {
    this.invSelectorOpen.set(false);
    if (focusTrigger) this.invTrigger?.nativeElement.focus();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.invSelectorOpen()) this.openInvSelector();
    }
  }

  onListboxKeydown(event: KeyboardEvent): void {
    const opciones = this.invOpciones();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i => Math.min(i + 1, opciones.length - 1));
        this.focusHighlighted();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i => Math.max(i - 1, 0));
        this.focusHighlighted();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.seleccionarInvernadero(opciones[this.highlightedIndex()].id);
        break;
      case 'Escape':
        event.preventDefault();
        this.closeInvSelector(true);
        break;
      case 'Tab':
        this.closeInvSelector(false);
        break;
    }
  }

  seleccionarInvernadero(id: number | null): void {
    this.cambiarInvernadero(id === null ? '' : String(id));
    this.closeInvSelector(true);
  }

  private syncHighlighted(): void {
    const id = this.invernaderoActivoId();
    const idx = this.invOpciones().findIndex(o => o.id === id);
    this.highlightedIndex.set(idx >= 0 ? idx : 0);
  }

  private focusHighlighted(): void {
    const opciones = this.invWrapper?.nativeElement.querySelectorAll<HTMLElement>('[role="option"]');
    opciones?.[this.highlightedIndex()]?.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.invSelectorOpen()) return;
    const target = event.target as Node;
    if (this.invWrapper && !this.invWrapper.nativeElement.contains(target)) {
      this.closeInvSelector(false);
    }
  }
}
