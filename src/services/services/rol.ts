import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RolResponse } from '../../interfaces/rol.interfaces';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly apiUrl = `${environment.apiUrl}/api/roles`;

  constructor(private http: HttpClient) {}

  listar(): Observable<RolResponse[]> {
    return this.http.get<RolResponse[]>(this.apiUrl).pipe(
      map(data => data ?? [])
    );
  }
}
