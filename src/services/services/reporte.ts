import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ReporteInventario,
  ReporteGuardado,
  ReporteGuardarRequest,
} from '../../interfaces/reporte.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly apiUrl = `${environment.apiUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  inventario(
    desde: string,
    hasta: string,
    tipo?: string | null,
    invernaderoId?: number | null,
  ): Observable<ReporteInventario> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (tipo) params = params.set('tipo', tipo);
    if (invernaderoId != null) params = params.set('invernaderoId', String(invernaderoId));
    return this.http.get<ReporteInventario>(`${this.apiUrl}/inventario`, { params });
  }

  guardar(req: ReporteGuardarRequest): Observable<ReporteGuardado> {
    return this.http.post<ReporteGuardado>(`${this.apiUrl}/guardados`, req);
  }

  listarGuardados(): Observable<ReporteGuardado[]> {
    return this.http.get<ReporteGuardado[]>(`${this.apiUrl}/guardados`);
  }

  obtenerGuardado(id: number): Observable<ReporteGuardado> {
    return this.http.get<ReporteGuardado>(`${this.apiUrl}/guardados/${id}`);
  }

  eliminarGuardado(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/guardados/${id}`);
  }
}
