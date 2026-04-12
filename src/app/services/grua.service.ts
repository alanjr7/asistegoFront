import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  UbicacionGrua,
  AsignacionGruaResponse,
  TrackingGruaResponse,
  Personal
} from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class GruaService {
  private api = inject(ApiService);

  /**
   * Actualizar ubicación del gruista (llamado desde app móvil)
   */
  actualizarUbicacion(
    gruistaId: string,
    lat: number,
    lng: number,
    disponible?: boolean,
    enServicio?: boolean,
    solicitudId?: string
  ): Observable<UbicacionGrua> {
    const data: any = { lat, lng };
    if (disponible !== undefined) data.disponible = disponible;
    if (enServicio !== undefined) data.en_servicio = enServicio;
    if (solicitudId !== undefined) data.solicitud_id = solicitudId;

    return this.api.post<UbicacionGrua>(`grua/ubicacion?gruista_id=${gruistaId}`, data);
  }

  /**
   * Listar gruistas disponibles
   */
  listarDisponibles(lat?: number, lng?: number): Observable<Array<{
    gruista_id: string;
    nombre: string;
    foto?: string;
    telefono?: string;
    lat: number;
    lng: number;
    timestamp: string;
    distancia_km?: number;
    tiempo_estimado_min?: number;
  }>> {
    const params = (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined;
    return this.api.get<any[]>('grua/disponibles', params);
  }

  /**
   * Obtener ubicación de un gruista específico
   */
  obtenerUbicacionGruista(gruistaId: string): Observable<{
    gruista_id: string;
    nombre?: string;
    lat: number;
    lng: number;
    disponible: boolean;
    en_servicio: boolean;
    solicitud_id?: string;
    timestamp: string;
  }> {
    return this.api.get<any>(`grua/${gruistaId}/ubicacion`);
  }

  /**
   * Asignar grúa automáticamente por proximidad
   */
  asignarGrua(solicitudId: string, latCliente: number, lngCliente: number): Observable<AsignacionGruaResponse> {
    return this.api.post<AsignacionGruaResponse>('grua/asignar', {
      solicitud_id: solicitudId,
      lat_cliente: latCliente,
      lng_cliente: lngCliente
    });
  }

  /**
   * Liberar grúa después de completar servicio
   */
  liberarGrua(gruistaId: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>(`grua/liberar/${gruistaId}`, {});
  }

  /**
   * Obtener tracking en tiempo real de una solicitud de grúa
   */
  trackingSolicitud(solicitudId: string): Observable<TrackingGruaResponse> {
    return this.api.get<TrackingGruaResponse>(`grua/solicitud/${solicitudId}/tracking`);
  }

  /**
   * Calcular distancia entre dos puntos (fórmula de Haversine)
   * Útil para cálculos en el frontend
   */
  calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calcular tiempo estimado de llegada
   */
  calcularTiempoEstimadoMin(distanciaKm: number, velocidadPromedioKmh: number = 30): number {
    const tiempoHoras = distanciaKm / velocidadPromedioKmh;
    return Math.max(1, Math.round(tiempoHoras * 60));
  }
}
