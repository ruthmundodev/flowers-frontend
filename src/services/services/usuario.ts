import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioRequest, UsuarioResponse } from '../../interfaces/usuario.interfaces';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  guardar(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/guardar`, request);
  }
}
