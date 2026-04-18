import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Evaluacion {
  id: string;
  solicitud_id: string;
  evaluador_id: string;
  evaluador_nombre?: string;
  diagnostico: string;
  gravedad: 'baja' | 'media' | 'alta' | 'critica';
  tiempo_estimado_reparacion: number;
  costo_estimado: number;
  repuestos_necesarios: string[];
  requiere_grua: boolean;
  notas_internas?: string;
  fecha_evaluacion: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface EvaluacionCreate {
  solicitud_id: string;
  diagnostico: string;
  gravedad: string;
  tiempo_estimado_reparacion: number;
  costo_estimado: number;
  repuestos_necesarios: string[];
  requiere_grua: boolean;
  notas_internas?: string;
  evaluador_id: string;
}

export interface DiagnosticoIA {
  diagnostico: string;
  gravedad: string;
  causas_probables: string[];
  repuestos_sugeridos: string[];
  tiempo_estimado_minutos: number;
  recomendaciones: string;
  requiere_grua: boolean;
  notas_tecnico: string;
}

export interface DiagnosticoIAResponse {
  diagnostico: DiagnosticoIA;
  modelo_usado: string;
  tokens_usados: number;
  solicitud_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private api = inject(ApiService);

  listar(filtros?: {
    solicitud_id?: string;
    gravedad?: string;
    estado?: string;
  }): Observable<Evaluacion[]> {
    return this.api.get<Evaluacion[]>('evaluaciones/', filtros);
  }

  obtener(id: string): Observable<Evaluacion> {
    return this.api.get<Evaluacion>(`evaluaciones/${id}`);
  }

  obtenerPorSolicitud(solicitudId: string): Observable<Evaluacion | null> {
    return this.api.get<Evaluacion | null>(`evaluaciones/solicitud/${solicitudId}`);
  }

  crear(evaluacion: EvaluacionCreate): Observable<Evaluacion> {
    return this.api.post<Evaluacion>('evaluaciones/', evaluacion);
  }

  actualizar(id: string, evaluacion: Partial<EvaluacionCreate>): Observable<Evaluacion> {
    return this.api.put<Evaluacion>(`evaluaciones/${id}`, evaluacion);
  }

  aprobar(id: string): Observable<{ success: boolean; message: string; evaluacion: Evaluacion }> {
    return this.api.put<{ success: boolean; message: string; evaluacion: Evaluacion }>(`evaluaciones/${id}/aprobar`, {});
  }

  rechazar(id: string, motivo?: string): Observable<{ success: boolean; message: string; evaluacion: Evaluacion }> {
    return this.api.put<{ success: boolean; message: string; evaluacion: Evaluacion }>(
      `evaluaciones/${id}/rechazar`,
      motivo ? { motivo } : {}
    );
  }

  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`evaluaciones/${id}`);
  }

  generarDiagnosticoIA(solicitudId: string): Observable<DiagnosticoIAResponse> {
    return this.api.post<DiagnosticoIAResponse>(`evaluaciones/solicitud/${solicitudId}/diagnostico-ia`, {});
  }

  getEstadisticas(): Observable<{
    total_evaluaciones: number;
    por_gravedad: Record<string, number>;
    por_estado: Record<string, number>;
    promedio_costo: number;
    promedio_tiempo: number;
    requieren_grua: number;
    con_repuestos: number;
  }> {
    return this.api.get('evaluaciones/stats/resumen');
  }
}
