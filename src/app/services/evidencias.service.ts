import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Evidencia, EvidenciaCreate, TipoEvidencia } from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class EvidenciasService {
  private api = inject(ApiService);

  /**
   * Listar evidencias de una solicitud
   */
  listarPorSolicitud(solicitudId: string, tipo?: TipoEvidencia): Observable<Evidencia[]> {
    const params = tipo ? { tipo } : undefined;
    return this.api.get<Evidencia[]>(`evidencias/solicitud/${solicitudId}`, params);
  }

  /**
   * Obtener una evidencia específica
   */
  obtener(id: string): Observable<Evidencia> {
    return this.api.get<Evidencia>(`evidencias/${id}`);
  }

  /**
   * Crear/registrar una evidencia (después de subir el archivo)
   */
  crear(evidencia: EvidenciaCreate): Observable<Evidencia> {
    return this.api.post<Evidencia>('evidencias/', evidencia);
  }

  /**
   * Eliminar una evidencia
   */
  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`evidencias/${id}`);
  }

  /**
   * Obtener estadísticas de evidencias de una solicitud
   */
  getStats(solicitudId: string): Observable<{
    solicitud_id: string;
    total_evidencias: number;
    imagenes: number;
    audios: number;
    videos: number;
  }> {
    return this.api.get<any>(`evidencias/stats/${solicitudId}`);
  }

  /**
   * Subir imagen y crear evidencia en un solo paso
   */
  async subirImagenYcrear(
    file: File,
    solicitudId: string,
    subidoPor: string,
    descripcion?: string,
    lat?: number,
    lng?: number
  ): Promise<Evidencia> {
    // 1. Subir archivo
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const uploadResponse = await this.api.post<{
      success: boolean;
      url: string;
      filename: string;
    }>('upload/image', formData).toPromise();

    if (!uploadResponse?.success) {
      throw new Error('Error al subir la imagen');
    }

    // 2. Crear evidencia
    const evidencia: EvidenciaCreate = {
      solicitud_id: solicitudId,
      tipo: 'imagen',
      url: uploadResponse.url,
      descripcion: descripcion || '',
      subido_por: subidoPor,
      lat: lat,
      lng: lng
    };

    return await this.crear(evidencia).toPromise() as Evidencia;
  }

  /**
   * Subir audio y crear evidencia en un solo paso
   */
  async subirAudioYCrear(
    file: File,
    solicitudId: string,
    subidoPor: string,
    descripcion?: string,
    lat?: number,
    lng?: number
  ): Promise<Evidencia> {
    // 1. Subir archivo
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const uploadResponse = await this.api.post<{
      success: boolean;
      url: string;
      filename: string;
    }>('upload/audio', formData).toPromise();

    if (!uploadResponse?.success) {
      throw new Error('Error al subir el audio');
    }

    // 2. Crear evidencia
    const evidencia: EvidenciaCreate = {
      solicitud_id: solicitudId,
      tipo: 'audio',
      url: uploadResponse.url,
      descripcion: descripcion || '',
      subido_por: subidoPor,
      lat: lat,
      lng: lng
    };

    return await this.crear(evidencia).toPromise() as Evidencia;
  }
}
