import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ParcelaRequest, ParcelaResponse } from '../../interfaces/parcela.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParcelaService {
  private readonly apiUrl = `${environment.apiUrl}/api/parcela`;

  constructor(private http: HttpClient) {}

  listar(invernaderoId?: number | null): Observable<ParcelaResponse[]> {
    let params = new HttpParams();
    if (invernaderoId != null) params = params.set('invernaderoId', invernaderoId);
    return this.http.get<ParcelaResponse[]>(`${this.apiUrl}/listar`, { params }).pipe(
      map(data => data ?? [])
    );
  }

  buscar(id: number): Observable<ParcelaResponse | null> {
    return this.http.get<ParcelaResponse | null>(`${this.apiUrl}/buscar/${id}`).pipe(
      map(data => data ?? null)
    );
  }

  guardar(request: ParcelaRequest): Observable<ParcelaResponse> {
    return this.http.post<ParcelaResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizar(id: number, request: ParcelaRequest): Observable<ParcelaResponse> {
    return this.http.put<ParcelaResponse>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}
