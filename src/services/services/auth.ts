import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, UsuarioSession } from '../../interfaces/auth.interfaces';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  readonly apiUrl = 'http://localhost:8080/api/auth';

  constructor(readonly http: HttpClient) {}

  login(correoElectronico: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { correoElectronico, password };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUsuario(): UsuarioSession | null {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Decodifica el payload (parte central) de un JWT sin librerías externas.
   * Maneja base64url y caracteres UTF-8 (nombres con acentos).
   */
  decodeToken(): Record<string, any> | null {
    const token = this.getToken();
    if (!token) return null;

    const partes = token.split('.');
    if (partes.length < 2) return null;

    try {
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /**
   * Nombre a mostrar del usuario autenticado.
   * Orden de preferencia: claim `nombre`/`name` del JWT → `nombreCompleto`
   * de la sesión guardada → `sub` del JWT (correo) → fallback "Usuario".
   */
  getNombreUsuario(): string {
    const payload = this.decodeToken();
    const nombreClaim = payload?.['nombre'] || payload?.['name'];
    if (nombreClaim) return String(nombreClaim);

    const nombreSesion = this.getUsuario()?.nombreCompleto;
    if (nombreSesion) return nombreSesion;

    if (payload?.['sub']) return String(payload['sub']);

    return 'Usuario';
  }
}
