import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InventarioItem } from '../../interfaces/inventario.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly apiUrl = `${environment.apiUrl}/api/inventario`;

  constructor(private http: HttpClient) {}

  /** tipo: SEMILLA (default) | POLEN | … Filtra el inventario por variedad.tipo. */
  listar(tipo: string = 'SEMILLA'): Observable<InventarioItem[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<InventarioItem[]>(`${this.apiUrl}/listar`, { params }).pipe(
      map(data => data ?? [])
    );
  }
}
