import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

interface StatsResponse {
  fecha_actual: string;
  conteos: {
    talleres: number;
    clientes: number;
    solicitudes: number;
    personal: number;
    repuestos: number;
    usuarios_registrados: number;
  };
  solicitudes: {
    por_estado: Record<string, number>;
    hoy: number;
    mes: number;
  };
  finanzas: {
    ingresos_totales: number;
    comisiones_totales: number;
    monto_neto: number;
  };
  actividad_hoy: {
    nuevas_solicitudes: number;
    nuevos_usuarios: number;
  };
}

interface TallerResponse {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  calificacion?: number;
  total_servicios?: number;
}

interface ClientesResponse {
  total: number;
  skip: number;
  limit: number;
  clientes: any[];
}

interface SolicitudesResponse {
  total: number;
  skip: number;
  limit: number;
  solicitudes: any[];
}

interface FinanzasResponse {
  periodo: {
    inicio: string;
    fin: string;
  };
  resumen: {
    total_facturas: number;
    monto_total: number;
    comisiones_total: number;
    promedio_factura: number;
  };
  por_metodo_pago: Record<string, number>;
  ingresos_por_dia: Record<string, number>;
}

interface ActividadRecienteResponse {
  solicitudes_recientes: Array<{
    id: string;
    estado: string;
    problema: string;
    timestamp: string;
  }>;
  usuarios_recientes: Array<{
    id: string;
    nombre: string;
    email: string;
    rol: string;
    tipo_usuario: string;
    created_at: string;
  }>;
}

interface UsuariosResponse {
  total: number;
  skip: number;
  limit: number;
  usuarios: Array<{
    id: string;
    nombre: string;
    email: string;
    rol: string;
    tipo_usuario: string;
    taller_id?: string;
    created_at: string;
    bloqueado_hasta?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStats(): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.apiUrl}/admin/stats`);
  }

  getTalleres(): Observable<TallerResponse[]> {
    return this.http.get<TallerResponse[]>(`${this.apiUrl}/admin/talleres`);
  }

  getClientes(skip: number = 0, limit: number = 100): Observable<ClientesResponse> {
    return this.http.get<ClientesResponse>(`${this.apiUrl}/admin/clientes`, {
      params: { skip: skip.toString(), limit: limit.toString() }
    });
  }

  getSolicitudes(skip: number = 0, limit: number = 100, estado?: string): Observable<SolicitudesResponse> {
    const params: any = { skip: skip.toString(), limit: limit.toString() };
    if (estado) {
      params.estado = estado;
    }
    return this.http.get<SolicitudesResponse>(`${this.apiUrl}/admin/solicitudes`, { params });
  }

  getFinanzas(fechaInicio?: string, fechaFin?: string): Observable<FinanzasResponse> {
    const params: any = {};
    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }
    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }
    return this.http.get<FinanzasResponse>(`${this.apiUrl}/admin/finanzas`, { params });
  }

  getActividadReciente(limit: number = 20): Observable<ActividadRecienteResponse> {
    return this.http.get<ActividadRecienteResponse>(`${this.apiUrl}/admin/actividad-reciente`, {
      params: { limit: limit.toString() }
    });
  }

  getUsuarios(skip: number = 0, limit: number = 100, rol?: string): Observable<UsuariosResponse> {
    const params: any = { skip: skip.toString(), limit: limit.toString() };
    if (rol) {
      params.rol = rol;
    }
    return this.http.get<UsuariosResponse>(`${this.apiUrl}/admin/usuarios`, { params });
  }
}
