import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InventarioItem } from '../../interfaces/inventario.interfaces';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly apiUrl = 'http://localhost:8080/api/inventario';

  constructor(private http: HttpClient) {}

  listar(): Observable<InventarioItem[]> {
    return this.http.get<InventarioItem[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }
}
