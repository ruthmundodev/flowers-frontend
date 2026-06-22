import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RendimientoRequest, RendimientoResponse } from '../../interfaces/rendimiento.interfaces';
import { VariedadResponse } from '../../interfaces/variedad.interfaces';

@Injectable({ providedIn: 'root' })
export class RendimientoService {
  private readonly apiUrl      = 'http://localhost:8080/api/rendimiento';
  private readonly variedadUrl = 'http://localhost:8080/api/variedad';

  constructor(private http: HttpClient) {}

  listar(): Observable<RendimientoResponse[]> {
    return this.http.get<RendimientoResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  guardar(request: RendimientoRequest): Observable<RendimientoResponse> {
    return this.http.post<RendimientoResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizar(id: number, request: RendimientoRequest): Observable<RendimientoResponse> {
    return this.http.put<RendimientoResponse>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }

  listarVariedades(): Observable<VariedadResponse[]> {
    return this.http.get<VariedadResponse[]>(`${this.variedadUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }
}
