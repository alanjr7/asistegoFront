import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ReporteFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
}

export interface ReporteSolicitudes {
  tipo: string;
  fecha_generacion: string;
  periodo: string;
  total_registros: number;
  datos: {
    por_estado: Record<string, number>;
    por_problema: Record<string, number>;
    total_ingresos: number;
    promedio_distancia: number;
    requirieron_repuestos: number;
  };
}

export interface ReportePagos {
  tipo: string;
  fecha_generacion: string;
  periodo: string;
  total_registros: number;
  datos: {
    por_metodo: Record<string, number>;
    total_monto: number;
    total_comisiones: number;
    total_general: number;
    facturas_enviadas: number;
    facturas_pendientes: number;
    promedio_monto: number;
  };
}

export interface ReportePersonal {
  tipo: string;
  fecha_generacion: string;
  periodo: string;
  total_registros: number;
  datos: {
    por_rol: Record<string, number>;
    por_estado: Record<string, number>;
    total_asistencias_dia: number;
    total_asistencias_mes: number;
    personal_activo: number;
    personal_ocupado: number;
    detalle_personal: Array<{
      id: string;
      nombre: string;
      rol: string;
      estado: string;
      asistencias_dia: number;
      asistencias_mes: number;
    }>;
  };
}

export interface ReporteClientes {
  tipo: string;
  fecha_generacion: string;
  periodo: string;
  total_registros: number;
  datos: {
    total_clientes: number;
    nuevos_en_periodo: number;
    clientes_recurrentes: number;
    promedio_servicios_por_cliente: number;
    clientes_con_calificacion: number;
    calificacion_promedio_general: number;
  };
}

export interface DashboardData {
  fecha: string;
  solicitudes: {
    hoy: number;
    mes: number;
    por_estado: Record<string, number>;
  };
  finanzas: {
    ingresos_hoy: number;
    ingresos_mes: number;
    total_transacciones_hoy: number;
    total_transacciones_mes: number;
  };
  personal: {
    total: number;
    disponibles: number;
    ocupados: number;
  };
  clientes: {
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private api = inject(ApiService);

  getDashboard(): Observable<DashboardData> {
    return this.api.get<DashboardData>('reportes/dashboard');
  }

  getReporteSolicitudes(filtros?: ReporteFiltros): Observable<ReporteSolicitudes> {
    return this.api.get<ReporteSolicitudes>('reportes/solicitudes', filtros);
  }

  getReportePagos(filtros?: ReporteFiltros & { metodo_pago?: string }): Observable<ReportePagos> {
    return this.api.get<ReportePagos>('reportes/pagos', filtros);
  }

  getReportePersonal(filtros?: ReporteFiltros): Observable<ReportePersonal> {
    return this.api.get<ReportePersonal>('reportes/personal', filtros);
  }

  getReporteClientes(filtros?: ReporteFiltros): Observable<ReporteClientes> {
    return this.api.get<ReporteClientes>('reportes/clientes', filtros);
  }

  generarReportePersonalizado(
    tipo: 'solicitudes' | 'pagos' | 'personal' | 'clientes' | 'inventario',
    filtros?: ReporteFiltros
  ): Observable<ReporteSolicitudes | ReportePagos | ReportePersonal | ReporteClientes> {
    return this.api.post(`reportes/generar`, {
      tipo,
      fecha_inicio: filtros?.fecha_inicio,
      fecha_fin: filtros?.fecha_fin,
      estado: filtros?.estado
    });
  }
}
