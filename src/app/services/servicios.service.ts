import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Servicio, ServicioCreate, ServicioUpdate } from '../models/types.model';

interface StatsResponse {
  total_servicios: number;
  ingresos_totales: number;
  promedio_monto: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private api = inject(ApiService);

  listar(params?: any): Observable<Servicio[]> {
    return this.api.get<Servicio[]>('servicios/', params);
  }

  obtener(id: string): Observable<Servicio> {
    return this.api.get<Servicio>(`servicios/${id}`);
  }

  crear(servicio: ServicioCreate): Observable<Servicio> {
    return this.api.post<Servicio>('servicios/', servicio);
  }

  actualizar(id: string, servicio: ServicioUpdate): Observable<Servicio> {
    return this.api.put<Servicio>(`servicios/${id}`, servicio);
  }

  getStats(): Observable<StatsResponse> {
    return this.api.get<StatsResponse>('servicios/stats/resumen');
  }
}
