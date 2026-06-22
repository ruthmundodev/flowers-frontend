import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CosechaMes, DashboardCultivo, DashboardStats } from '../../interfaces/dashboard.interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getCultivosActivos(): Observable<DashboardCultivo[]> {
    return this.http.get<DashboardCultivo[]>(`${this.apiUrl}/cultivos-activos`).pipe(
      map(data => data ?? [])
    );
  }

  getCosechasPorMes(): Observable<CosechaMes[]> {
    return this.http.get<CosechaMes[]>(`${this.apiUrl}/cosechas-mes`).pipe(
      map(data => data ?? [])
    );
  }
}
