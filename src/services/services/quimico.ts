import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuimicoRequest, QuimicoResponse } from '../../interfaces/quimico.interfaces';
import { VariedadResponse } from '../../interfaces/variedad.interfaces';

@Injectable({ providedIn: 'root' })
export class QuimicoService {
  private readonly apiUrl      = 'http://localhost:8080/api/quimico';
  private readonly variedadUrl = 'http://localhost:8080/api/variedad';

  constructor(private http: HttpClient) {}

  listar(): Observable<QuimicoResponse[]> {
    return this.http.get<QuimicoResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  guardar(request: QuimicoRequest): Observable<QuimicoResponse> {
    return this.http.post<QuimicoResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizar(id: number, request: QuimicoRequest): Observable<QuimicoResponse> {
    return this.http.put<QuimicoResponse>(`${this.apiUrl}/actualizar/${id}`, request);
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
