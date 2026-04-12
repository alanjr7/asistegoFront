import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Factura, FacturaCreate, FacturaUpdate } from '../models/types.model';

interface StatsResponse {
  total_facturas: number;
  facturas_enviadas: number;
  ingresos_totales: number;
}

interface DailyStatsResponse {
  fecha: string;
  total_facturas_hoy: number;
  ingresos_hoy: number;
  comisiones_hoy: number;
  total_con_comision_hoy: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  private api = inject(ApiService);

  listar(): Observable<Factura[]> {
    return this.api.get<Factura[]>('facturas/');
  }

  obtener(id: string): Observable<Factura> {
    return this.api.get<Factura>(`facturas/${id}`);
  }

  crear(factura: FacturaCreate): Observable<Factura> {
    return this.api.post<Factura>('facturas/', factura);
  }

  actualizar(id: string, factura: FacturaUpdate): Observable<Factura> {
    return this.api.put<Factura>(`facturas/${id}`, factura);
  }

  enviar(id: string): Observable<Factura> {
    return this.api.put<Factura>(`facturas/${id}/enviar`);
  }

  getStats(): Observable<StatsResponse> {
    return this.api.get<StatsResponse>('facturas/stats/resumen');
  }

  getDailyStats(): Observable<DailyStatsResponse> {
    return this.api.get<DailyStatsResponse>('facturas/stats/diarias');
  }
}
