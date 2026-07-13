import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, PermisoSession, UsuarioSession } from '../../interfaces/auth.interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  readonly apiUrl = `${environment.apiUrl}/api/auth`;

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
    if (!data) return null;
    try {
      return JSON.parse(data) as UsuarioSession;
    } catch {
      // JSON corrupto en localStorage → tratamos como sin sesión.
      return null;
    }
  }

  /**
   * ¿La sesión guardada está completa y es usable? (P7)
   *
   * Una sesión con token pero sin rol —o un no-admin sin permisos— deja al
   * usuario con el menú vacío y atascado. En ese caso la consideramos inválida
   * para forzar un re-login limpio en lugar de mostrar una app inservible.
   */
  sesionValida(): boolean {
    if (!this.getToken()) return false;

    const usuario = this.getUsuario();
    if (!usuario || !usuario.rol?.nombre) return false;

    // El Administrador no depende de la matriz de permisos.
    if (usuario.rol.nombre === 'Administrador') return true;

    return Array.isArray(usuario.permisos) && usuario.permisos.length > 0;
  }

  /** True si el usuario autenticado tiene rol Administrador. */
  esAdministrador(): boolean {
    return this.getUsuario()?.rol?.nombre === 'Administrador';
  }

  /** Permiso del usuario para un módulo (por nombre), o null si no lo tiene. */
  getPermiso(modulo: string): PermisoSession | null {
    return this.getUsuario()?.permisos?.find(p => p.moduloNombre === modulo) ?? null;
  }

  /**
   * ¿Puede el usuario ver (consultar) el módulo indicado?
   * El Administrador siempre puede; el resto según su matriz de permisos.
   */
  puedeConsultar(modulo: string): boolean {
    if (this.esAdministrador()) return true;
    return !!this.getPermiso(modulo)?.consultar;
  }

  /**
   * ¿Puede el usuario ejecutar `accion` sobre `modulo`?
   * El Administrador siempre puede; el resto según su matriz de permisos.
   */
  puede(modulo: string, accion: 'crear' | 'consultar' | 'editar' | 'eliminar'): boolean {
    if (this.esAdministrador()) return true;
    return !!this.getPermiso(modulo)?.[accion];
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
