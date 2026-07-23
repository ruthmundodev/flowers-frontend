import { Component, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificacionAnuncioService } from '../../../services/services/notificacion-anuncio';
import { NotificacionResponse } from '../../../interfaces/notificacion-anuncio.interfaces';
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
  private router = inject(Router);

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

  /** Abre el anuncio: lo marca como leído, cierra el panel y navega a él. */
  abrir(n: NotificacionResponse): void {
    if (!n.leido) {
      this.notif.marcarLeido(n.id).subscribe(() => this.cdr.markForCheck());
    }
    this.cerrar();
    this.router.navigate(['/anuncios'], { queryParams: { id: n.id } });
  }

  marcarTodas(): void {
    this.notif.marcarTodas().subscribe(() => this.cdr.markForCheck());
  }

  prioClase(prioridad: string | null | undefined): string {
    return 'prio-' + (prioridad || 'NORMAL').toLowerCase();
  }
}
