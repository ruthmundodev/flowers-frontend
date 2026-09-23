import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CosechaRequest, CultivoRequest, CultivoResponse } from '../../interfaces/cultivo.interfaces';
import { RendimientoResponse } from '../../interfaces/rendimiento.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CultivoService {
  private readonly apiUrl = `${environment.apiUrl}/api/cultivo`;

  constructor(private http: HttpClient) {}

  listar(invernaderoId?: number | null, temporadaId?: number | null): Observable<CultivoResponse[]> {
    let params = new HttpParams();
    if (invernaderoId != null) params = params.set('invernaderoId', invernaderoId);
    if (temporadaId != null) params = params.set('temporadaId', temporadaId);
    return this.http.get<CultivoResponse[]>(`${this.apiUrl}/listar`, { params }).pipe(
      map(data => data ?? [])
    );
  }

  buscar(id: number): Observable<CultivoResponse | null> {
    return this.http.get<CultivoResponse | null>(`${this.apiUrl}/buscar/${id}`).pipe(
      map(data => data ?? null)
    );
  }

  guardar(request: CultivoRequest): Observable<CultivoResponse> {
    return this.http.post<CultivoResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizar(id: number, request: CultivoRequest): Observable<CultivoResponse> {
    return this.http.put<CultivoResponse>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }

  registrarCosecha(id: number, request: CosechaRequest): Observable<RendimientoResponse> {
    return this.http.post<RendimientoResponse>(`${this.apiUrl}/${id}/cosecha`, request);
  }
}
