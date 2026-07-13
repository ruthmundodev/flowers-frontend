import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VariedadRequest, VariedadResponse } from '../../interfaces/variedad.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VariedadService {
  private readonly apiUrl = `${environment.apiUrl}/api/variedad`;

  constructor(private http: HttpClient) {}

  listar(): Observable<VariedadResponse[]> {
    return this.http.get<VariedadResponse[]>(`${this.apiUrl}/listar`).pipe(
      map(data => data ?? [])
    );
  }

  guardar(request: VariedadRequest): Observable<VariedadResponse> {
    return this.http.post<VariedadResponse>(`${this.apiUrl}/guardar`, request);
  }
}
