import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Personal, PersonalCreate, PersonalUpdate, EstadoPersonal, RolPersonal } from '../models/types.model';

interface StatsResponse {
  asistencias_dia: number;
  asistencias_mes: number;
  nombre: string;
  rol: RolPersonal;
}

@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  private api = inject(ApiService);

  listar(filtros?: {
    estado?: EstadoPersonal;
    rol?: RolPersonal;
    disponibles?: boolean;
  }): Observable<Personal[]> {
    return this.api.get<Personal[]>('personal/', filtros);
  }

  obtener(id: string): Observable<Personal> {
    return this.api.get<Personal>(`personal/${id}`);
  }

  crear(personal: PersonalCreate): Observable<Personal> {
    return this.api.post<Personal>('personal/', personal);
  }

  actualizar(id: string, personal: PersonalUpdate): Observable<Personal> {
    return this.api.put<Personal>(`personal/${id}`, personal);
  }

  cambiarEstado(id: string, estado: EstadoPersonal): Observable<Personal> {
    return this.api.put<Personal>(`personal/${id}/estado`, { estado });
  }

  getStats(id: string): Observable<StatsResponse> {
    return this.api.get<StatsResponse>(`personal/${id}/stats`);
  }

  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`personal/${id}`);
  }
}
