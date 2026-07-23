import { Component, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificacionAnuncioService } from '../../../services/services/notificacion-anuncio';
import { Auth } from '../../../services/services/auth';

/**
 * Campana de notificaciones: badge con el número de anuncios no leídos y un
 * panel desplegable con la lista. El contador se refresca por polling cada 60s
 * (pausado si la pestaña está oculta o no hay sesión).
 */
@Component({
  selector: 'app-campana',
  imports: [CommonModule, RouterLink],
  templateUrl: './campana.html',
  styleUrl: './campana.scss',
})
export class Campana {
  private notif = inject(NotificacionAnuncioService);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);

  readonly noLeidas = this.notif.noLeidas;
  readonly lista = this.notif.lista;
  readonly abierto = signal(false);

  private readonly INTERVALO_MS = 60000;

  constructor() {
    timer(0, this.INTERVALO_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!document.hidden && this.auth.isLoggedIn()) {
          this.notif.refrescarContador().subscribe(() => this.cdr.markForCheck());
        }
      });
  }

  toggle(): void {
    const abrir = !this.abierto();
    this.abierto.set(abrir);
    if (abrir) {
      this.notif.cargarLista().subscribe(() => this.cdr.markForCheck());
    }
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  marcarLeido(id: number, ev: Event): void {
    ev.stopPropagation();
    this.notif.marcarLeido(id).subscribe(() => this.cdr.markForCheck());
  }

  marcarTodas(): void {
    this.notif.marcarTodas().subscribe(() => this.cdr.markForCheck());
  }

  prioClase(prioridad: string | null | undefined): string {
    return 'prio-' + (prioridad || 'NORMAL').toLowerCase();
  }
}
