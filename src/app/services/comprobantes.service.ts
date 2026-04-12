import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ComprobantePago, ComprobantePagoCreate, MetodoPago } from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class ComprobantesService {
  private api = inject(ApiService);

  /**
   * Listar comprobantes de una solicitud
   */
  listarPorSolicitud(solicitudId: string): Observable<ComprobantePago[]> {
    return this.api.get<ComprobantePago[]>(`comprobantes/solicitud/${solicitudId}`);
  }

  /**
   * Obtener un comprobante específico
   */
  obtener(id: string): Observable<ComprobantePago> {
    return this.api.get<ComprobantePago>(`comprobantes/${id}`);
  }

  /**
   * Crear/registrar un comprobante (después de subir el archivo)
   */
  crear(comprobante: ComprobantePagoCreate): Observable<ComprobantePago> {
    return this.api.post<ComprobantePago>('comprobantes/', comprobante);
  }

  /**
   * Subir comprobante y crear registro en un solo paso
   */
  async subirYcrear(
    file: File,
    solicitudId: string,
    monto: number,
    metodoPago: MetodoPago,
    notas?: string
  ): Promise<ComprobantePago> {
    // 1. Subir archivo
    const formData = new FormData();
    formData.append('file', file);
    formData.append('solicitud_id', solicitudId);

    const uploadResponse = await this.api.post<{
      success: boolean;
      url: string;
      filename: string;
    }>('upload/comprobante', formData).toPromise();

    if (!uploadResponse?.success) {
      throw new Error('Error al subir el comprobante');
    }

    // 2. Crear comprobante
    const comprobante: ComprobantePagoCreate = {
      solicitud_id: solicitudId,
      monto: monto,
      metodo_pago: metodoPago,
      url_imagen: uploadResponse.url,
      notas: notas || ''
    };

    return await this.crear(comprobante).toPromise() as ComprobantePago;
  }

  /**
   * Verificar un comprobante (por el taller)
   */
  verificar(id: string): Observable<ComprobantePago> {
    return this.api.put<ComprobantePago>(`comprobantes/${id}/verificar`, {});
  }

  /**
   * Rechazar un comprobante (por el taller)
   */
  rechazar(id: string, motivo: string): Observable<ComprobantePago> {
    return this.api.put<ComprobantePago>(`comprobantes/${id}/rechazar?motivo=${encodeURIComponent(motivo)}`, {});
  }

  /**
   * Eliminar un comprobante
   */
  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`comprobantes/${id}`);
  }

  /**
   * Obtener estadísticas de comprobantes del taller
   */
  getStats(): Observable<{
    total: number;
    verificados: number;
    pendientes: number;
    rechazados: number;
    por_metodo: Record<MetodoPago, number>;
  }> {
    return this.api.get<any>('comprobantes/stats/taller');
  }
}
