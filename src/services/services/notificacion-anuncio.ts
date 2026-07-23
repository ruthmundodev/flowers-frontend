import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  NotificacionResponse,
  ContadorNoLeidas,
} from '../../interfaces/notificacion-anuncio.interfaces';

/**
 * Campana de notificaciones de anuncios (NO confundir con NotificacionService,
 * que son los toasts). Mantiene el contador de no leídas y la lista como
 * signals; el componente `Campana` hace el polling del contador.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionAnuncioService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/notificaciones`;

  readonly noLeidas = signal<number>(0);
  readonly lista = signal<NotificacionResponse[]>([]);

  /** Solo el contador (respuesta mínima) — ideal para el polling del badge. */
  refrescarContador(): Observable<number> {
    return this.http.get<ContadorNoLeidas>(`${this.apiUrl}/no-leidas`).pipe(
      map(r => r?.noLeidas ?? 0),
      tap(n => this.noLeidas.set(n)),
      catchError(() => of(this.noLeidas())),
    );
  }

  /** Lista completa de mis notificaciones (al abrir el panel). */
  cargarLista(): Observable<NotificacionResponse[]> {
    return this.http.get<NotificacionResponse[]>(this.apiUrl).pipe(
      map(d => d ?? []),
      tap(l => {
        this.lista.set(l);
        this.noLeidas.set(l.filter(n => !n.leido).length);
      }),
      catchError(() => of([])),
    );
  }

  marcarLeido(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/leer`, {}).pipe(
      tap(() => {
        this.lista.update(l => l.map(n => (n.id === id ? { ...n, leido: true } : n)));
        this.noLeidas.set(this.lista().filter(n => !n.leido).length);
      }),
    );
  }

  marcarTodas(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/leer-todas`, {}).pipe(
      tap(() => {
        this.lista.update(l => l.map(n => ({ ...n, leido: true })));
        this.noLeidas.set(0);
      }),
    );
  }
}
