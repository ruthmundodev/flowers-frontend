import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioRequest, UsuarioResponse } from '../../interfaces/usuario.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  guardar(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/guardar`, request);
  }

  actualizarRol(id: number, rolId: number): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}/rol`, { rolId });
  }

  resetearPassword(id: number, nuevaPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/password`, { nuevaPassword });
  }

  toggleActivo(id: number): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/${id}/activo`, {});
  }
}
