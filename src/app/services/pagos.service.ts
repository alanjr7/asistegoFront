import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface ConfirmarPagoRequest {
  solicitud_id: string;
  monto: number;
}

interface ConfirmarPagoResponse {
  success: boolean;
  message: string;
  solicitud_id: string;
  monto: number;
  comision: number;
  total: number;
  estado_pago: string;
}

interface EstadoPagoResponse {
  solicitud_id: string;
  estado_pago: string;
  monto: number | null;
  comision: number | null;
  total: number | null;
  tiene_factura: boolean;
  factura_id: string | null;
  pagado: boolean;
}

interface ProcesarPagoRequest {
  solicitud_id: string;
  metodo_pago: 'qr' | 'tarjeta' | 'efectivo';
  comprobante?: string;
}

interface ProcesarPagoResponse {
  success: boolean;
  message: string;
  factura_id: string;
  solicitud_id: string;
  monto: number;
  comision: number;
  total: number;
  metodo_pago: string;
  estado_pago: string;
}

interface PagoCliente {
  factura_id: string;
  solicitud_id: string;
  monto: number;
  comision: number;
  total: number;
  metodo_pago: string;
  estado: string;
  fecha: string;
  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
  } | null;
}

interface ResumenPagosTaller {
  pendientes_confirmacion: number;
  esperando_pago: number;
  monto_esperado: number;
  servicios_pagados: number;
  ingresos_totales: number;
  comisiones_totales: number;
  neto_total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private api = inject(ApiService);

  /**
   * Confirmar el monto a cobrar por una solicitud (taller)
   */
  confirmarPago(solicitudId: string, monto: number): Observable<ConfirmarPagoResponse> {
    const body: ConfirmarPagoRequest = {
      solicitud_id: solicitudId,
      monto: monto
    };
    return this.api.post<ConfirmarPagoResponse>('pagos/confirmar', body);
  }

  /**
   * Verificar el estado de pago de una solicitud
   */
  verificarEstadoPago(solicitudId: string): Observable<EstadoPagoResponse> {
    return this.api.get<EstadoPagoResponse>(`pagos/solicitud/${solicitudId}/estado`);
  }

  /**
   * Procesar el pago de una solicitud (cliente)
   */
  procesarPago(solicitudId: string, metodoPago: 'qr' | 'tarjeta' | 'efectivo', comprobante?: string): Observable<ProcesarPagoResponse> {
    const body: ProcesarPagoRequest = {
      solicitud_id: solicitudId,
      metodo_pago: metodoPago,
      comprobante
    };
    return this.api.post<ProcesarPagoResponse>('pagos/procesar', body);
  }

  /**
   * Listar historial de pagos de un cliente
   */
  listarPagosCliente(clienteId: string): Observable<PagoCliente[]> {
    return this.api.get<PagoCliente[]>(`pagos/cliente/${clienteId}`);
  }

  /**
   * Listar pagos pendientes (para el taller)
   */
  listarPagosPendientes(): Observable<any[]> {
    return this.api.get<any[]>('pagos/taller/pendientes');
  }

  /**
   * Obtener resumen de pagos para el dashboard del taller
   */
  getResumenPagos(): Observable<ResumenPagosTaller> {
    return this.api.get<ResumenPagosTaller>('pagos/taller/resumen');
  }
}
