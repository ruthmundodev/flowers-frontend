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
}
