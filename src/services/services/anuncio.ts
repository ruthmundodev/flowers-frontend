import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AnuncioRequest, AnuncioResponse } from '../../interfaces/anuncio.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnuncioService {
  private readonly apiUrl = `${environment.apiUrl}/api/anuncio`;

  constructor(private http: HttpClient) {}

  listar(): Observable<AnuncioResponse[]> {
    // El backend responde 204 (body vacío) cuando no hay anuncios.
    return this.http.get<AnuncioResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? []),
      catchError(() => of([])),
    );
  }

  guardar(request: AnuncioRequest): Observable<AnuncioResponse> {
    return this.http.post<AnuncioResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizar(id: number, request: AnuncioRequest): Observable<AnuncioResponse> {
    return this.http.put<AnuncioResponse>(`${this.apiUrl}/actualizar/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}
