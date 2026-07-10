import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  InvernaderoUsuarioRequest,
  InvernaderoUsuarioResponse,
} from '../../interfaces/invernadero-usuario.interfaces';

@Injectable({ providedIn: 'root' })
export class InvernaderoUsuarioService {
  private readonly apiUrl = 'http://localhost:8080/api/invernadero-usuario';

  constructor(private http: HttpClient) {}

  asignar(request: InvernaderoUsuarioRequest): Observable<InvernaderoUsuarioResponse> {
    return this.http.post<InvernaderoUsuarioResponse>(`${this.apiUrl}/asignar`, request);
  }

  listarPorUsuario(usuarioId: number): Observable<InvernaderoUsuarioResponse[]> {
    // El backend responde 204 (body vacío) cuando el usuario no tiene asignaciones.
    return this.http
      .get<InvernaderoUsuarioResponse[]>(`${this.apiUrl}/por-usuario/${usuarioId}`)
      .pipe(
        map(data => data ?? []),
        catchError(() => of([])),
      );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}
