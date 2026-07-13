import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CosechaMes, DashboardCultivo, DashboardStats } from '../../interfaces/dashboard.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(invernaderoId?: number | null): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats${this.q(invernaderoId)}`);
  }

  getCultivosActivos(invernaderoId?: number | null): Observable<DashboardCultivo[]> {
    return this.http.get<DashboardCultivo[]>(`${this.apiUrl}/cultivos-activos${this.q(invernaderoId)}`).pipe(
      map(data => data ?? [])
    );
  }

  getCosechasPorMes(invernaderoId?: number | null): Observable<CosechaMes[]> {
    return this.http.get<CosechaMes[]>(`${this.apiUrl}/cosechas-mes${this.q(invernaderoId)}`).pipe(
      map(data => data ?? [])
    );
  }

  private q(invernaderoId?: number | null): string {
    return invernaderoId != null ? `?invernaderoId=${invernaderoId}` : '';
  }
}
