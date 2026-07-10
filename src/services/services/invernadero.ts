import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InvernaderoResponse } from '../../interfaces/invernadero.interfaces';

@Injectable({ providedIn: 'root' })
export class InvernaderoService {
  private readonly apiUrl = 'http://localhost:8080/api/invernadero';

  constructor(private http: HttpClient) {}

  listar(): Observable<InvernaderoResponse[]> {
    return this.http.get<InvernaderoResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }
}
