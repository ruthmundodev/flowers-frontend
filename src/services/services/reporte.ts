import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReporteInventario } from '../../interfaces/reporte.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly apiUrl = `${environment.apiUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  /** desde / hasta en formato ISO yyyy-MM-dd */
  inventario(desde: string, hasta: string): Observable<ReporteInventario> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ReporteInventario>(`${this.apiUrl}/inventario`, { params });
  }
}
