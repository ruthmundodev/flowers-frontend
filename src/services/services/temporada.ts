import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TemporadaRequest, TemporadaResponse } from '../../interfaces/temporada.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TemporadaService {
  private readonly apiUrl = `${environment.apiUrl}/api/temporada`;

  constructor(private http: HttpClient) {}

  listar(): Observable<TemporadaResponse[]> {
    return this.http.get<TemporadaResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  guardar(request: TemporadaRequest): Observable<TemporadaResponse> {
    return this.http.post<TemporadaResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizar(id: number, request: TemporadaRequest): Observable<TemporadaResponse> {
    return this.http.put<TemporadaResponse>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}
