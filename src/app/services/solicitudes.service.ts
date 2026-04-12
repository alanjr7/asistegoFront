import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Solicitud, SolicitudCreate, SolicitudUpdate, EstadoSolicitud } from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private api = inject(ApiService);

  listar(filtros?: {
    estado?: EstadoSolicitud;
    pendientes?: boolean;
    activas?: boolean;
  }): Observable<Solicitud[]> {
    return this.api.get<Solicitud[]>('solicitudes/', filtros);
  }

  obtener(id: string): Observable<Solicitud> {
    return this.api.get<Solicitud>(`solicitudes/${id}`);
  }

  crear(solicitud: SolicitudCreate): Observable<Solicitud> {
    return this.api.post<Solicitud>('solicitudes/', solicitud);
  }

  actualizar(id: string, solicitud: SolicitudUpdate): Observable<Solicitud> {
    return this.api.put<Solicitud>(`solicitudes/${id}`, solicitud);
  }

  cambiarEstado(id: string, estado: EstadoSolicitud): Observable<Solicitud> {
    return this.api.put<Solicitud>(`solicitudes/${id}/estado`, { estado });
  }

  asignarMecanico(id: string, mecanicoId: string): Observable<Solicitud> {
    return this.api.put<Solicitud>(`solicitudes/${id}/asignar`, { mecanico_id: mecanicoId });
  }

  asignarPersonal(id: string, personalIds: string[]): Observable<Solicitud> {
    return this.api.put<Solicitud>(`solicitudes/${id}/asignar`, { personal_ids: personalIds });
  }

  liberarPersonal(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(`solicitudes/${id}/liberar`, {});
  }

  cancelar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`solicitudes/${id}`);
  }
}
