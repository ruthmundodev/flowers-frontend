import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FincaResponse } from '../../interfaces/finca.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FincaService {
  private readonly apiUrl = `${environment.apiUrl}/api/finca`;
  private http = inject(HttpClient);

  /**
   * Finca activa (id) — null = "todas las que puede ver".
   * Persistida en localStorage y reactiva vía signal, para que el dashboard
   * se actualice cuando el usuario cambia de finca en el sidebar.
   */
  readonly fincaActivaId = signal<number | null>(this.leerLocal());

  listar(): Observable<FincaResponse[]> {
    // 204 (sin fincas) → []
    return this.http.get<FincaResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(d => d ?? []),
      catchError(() => of([])),
    );
  }

  setFincaActiva(id: number | null): void {
    if (id == null) {
      localStorage.removeItem('fincaId');
    } else {
      localStorage.setItem('fincaId', String(id));
    }
    this.fincaActivaId.set(id);
  }

  private leerLocal(): number | null {
    const v = localStorage.getItem('fincaId');
    return v ? Number(v) : null;
  }
}
