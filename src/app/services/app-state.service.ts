import { Injectable, signal, computed } from '@angular/core';
import { Solicitud, Notificacion, Calificacion } from '../models/types.model';
import { MockDataService } from './mock-data.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  isAuthenticated = signal(false);
  currentView = signal('dashboard');
  solicitudActiva = signal<Solicitud | null>(null);
  notificaciones = signal<Notificacion[]>([]);
  showCalificacionModal = signal(false);
  servicioParaCalificar = signal<Solicitud | null>(null);

  notificacionesNoLeidas = computed(() =>
    this.notificaciones().filter(n => !n.leida).length
  );

  constructor(private mockData: MockDataService) {
    this.notificaciones.set([...mockData.notificaciones]);
  }

  login() { this.isAuthenticated.set(true); }

  logout() {
    this.isAuthenticated.set(false);
    this.currentView.set('dashboard');
    this.solicitudActiva.set(null);
  }

  navigateTo(view: string) { this.currentView.set(view); }

  addNotificacion(notif: Omit<Notificacion, 'id' | 'timestamp' | 'leida'>) {
    const nueva: Notificacion = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date(),
      leida: false,
    };
    this.notificaciones.update(list => [nueva, ...list]);
  }

  aceptarSolicitud(solicitud: Solicitud) {
    this.solicitudActiva.set(solicitud);
    this.currentView.set('seguimiento');
    this.addNotificacion({
      tipo: 'solicitud',
      titulo: 'Solicitud aceptada',
      mensaje: `Has aceptado la solicitud de ${solicitud.cliente.nombre}`,
    });
  }

  finalizarServicio() {
    const s = this.solicitudActiva();
    if (s) {
      this.addNotificacion({ tipo: 'pago', titulo: 'Servicio finalizado', mensaje: `Servicio completado para ${s.cliente.nombre}` });
    }
    this.solicitudActiva.set(null);
    this.currentView.set('dashboard');
  }

  confirmarPago() {
    const s = this.solicitudActiva();
    if (s) {
      this.addNotificacion({ tipo: 'pago', titulo: 'Pago confirmado y factura enviada', mensaje: `Pago recibido y factura enviada a ${s.cliente.nombre}` });
      this.servicioParaCalificar.set(s);
      this.showCalificacionModal.set(true);
    }
  }

  enviarCalificacion(cal: Calificacion) {
    const s = this.servicioParaCalificar();
    this.addNotificacion({ tipo: 'mensaje', titulo: 'Solicitud de calificación enviada', mensaje: `Enviaste solicitud de calificación a ${s?.cliente.nombre}` });
    this.showCalificacionModal.set(false);
    this.servicioParaCalificar.set(null);
    this.solicitudActiva.set(null);
    this.currentView.set('dashboard');
  }

  cerrarCalificacion() {
    this.showCalificacionModal.set(false);
    this.servicioParaCalificar.set(null);
    this.solicitudActiva.set(null);
    this.currentView.set('dashboard');
  }

  getTitulo(): string {
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      seguimiento: 'Seguimiento en Tiempo Real',
      chat: 'Mensajes',
      pagos: 'Pagos y Facturas',
      repuestos: 'Repuestos',
      clientes: 'Clientes',
      historial: 'Historial',
      notificaciones: 'Notificaciones',
      personal: 'Personal',
      perfil: 'Perfil del Taller',
    };
    return map[this.currentView()] ?? 'AsisteGO';
  }
}
