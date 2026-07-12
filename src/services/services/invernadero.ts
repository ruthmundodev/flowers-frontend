import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';

@Injectable({ providedIn: 'root' })
export class InvernaderoService {
  private readonly apiUrl = 'http://localhost:8080/api/invernadero';

  readonly invernaderoActivoId = signal<number | null>(this.leerLocal());

  constructor(private http: HttpClient) {}

  listar(): Observable<InvernaderoResponse[]> {
    return this.http.get<InvernaderoResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  setInvernaderoActivo(id: number | null): void {
    if (id == null) {
      localStorage.removeItem('invernaderoId');
    } else {
      localStorage.setItem('invernaderoId', String(id));
    }
    this.invernaderoActivoId.set(id);
  }

  private leerLocal(): number | null {
    const v = localStorage.getItem('invernaderoId');
    if (!v) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
}
