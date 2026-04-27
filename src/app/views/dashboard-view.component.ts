import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { SolicitudesService } from '../services/solicitudes.service';
import { PersonalService } from '../services/personal.service';
import { TallerService } from '../services/taller.service';
import { MockDataService, SANTA_CRUZ_CENTER } from '../services/mock-data.service';
import { Solicitud, Personal, Factura, Taller } from '../models/types.model';
import { FacturasService } from '../services/facturas.service';
import { PagosService } from '../services/pagos.service';
import { ConfirmarPagoComponent } from '../components/confirmar-pago/confirmar-pago.component';

declare const L: any;

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule, ConfirmarPagoComponent],
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css'],
})
export class DashboardViewComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  solicitudesService = inject(SolicitudesService);
  personalService = inject(PersonalService);
  facturasService = inject(FacturasService);
  pagosService = inject(PagosService);
  tallerService = inject(TallerService);
  mockData = inject(MockDataService);

  solicitudes = signal<Solicitud[]>([]);
  personal = signal<Personal[]>([]);
  taller = signal<Taller | null>(null);
  pagosRecientes = signal<Factura[]>([]);
  selectedSolicitud = signal<Solicitud | null>(null);
  showAnalisisIA = signal(false);
  distanciaMaxima = signal(10);
  mapaExpandido = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  ingresosHoy = signal<number>(0);
  serviciosHoy = signal<number>(0);

  // ============ MODAL ASIGNACIÓN DE PERSONAL ============
  showAsignacionModal = signal(false);
  personalSeleccionadoIds = signal<string[]>([]);
  asignando = signal(false);
  asignacionError = signal<string | null>(null);

  // ============ MODAL CONFIRMAR PAGO ============
  showConfirmarPagoModal = signal(false);
  confirmandoPago = signal(false);

  private map: any = null;
  private markers: any[] = [];

  get solicitudesPendientes() {
    return this.solicitudes().filter(s => s.estado === 'pendiente' && s.distancia <= this.distanciaMaxima());
  }

  private refreshInterval: any;
  private solicitudesInterval: any;

  ngOnInit() {
    this.cargarDatos();
    this.cargarTaller();
    this.cargarPagosRecientes();
    this.cargarIngresosHoy();
    setTimeout(() => this.initMap(), 100);

    // Auto-refresh every 30 seconds to detect new payments
    this.refreshInterval = setInterval(() => {
      this.cargarIngresosHoy();
      this.cargarPagosRecientes();
    }, 30000);

    // Auto-refresh every 2 seconds to detect new solicitudes cercanas
    this.solicitudesInterval = setInterval(() => {
      this.cargarSolicitudes();
    }, 2000);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.solicitudesInterval) {
      clearInterval(this.solicitudesInterval);
    }
  }

  cargarDatos() {
    this.cargarSolicitudes();
    this.cargarPersonal();
  }

  cargarSolicitudes() {
    this.solicitudesService.listar({ pendientes: true })
      .subscribe({
        next: (data) => this.solicitudes.set(data),
        error: () => this.solicitudes.set([...this.mockData.solicitudes])
      });
  }

  cargarPersonal() {
    this.personalService.listar({ disponibles: true })
      .subscribe({
        next: (data) => this.personal.set(data),
        error: () => this.personal.set([...this.mockData.personal])
      });
  }

  cargarTaller() {
    this.tallerService.obtener()
      .subscribe({
        next: (data) => {
          this.taller.set(data);
          this.updateMarkers();
        },
        error: () => {
          // Fallback: usar datos mock del taller
          this.taller.set({
            id: '1',
            nombre: 'Taller Mecánico AsisteGO',
            direccion: 'Av. Principal 123, Santa Cruz',
            telefono: '123456789',
            email: 'taller@asistego.com',
            calificacion: 4.8,
            totalServicios: 156,
            lat: SANTA_CRUZ_CENTER.lat,
            lng: SANTA_CRUZ_CENTER.lng
          });
          this.updateMarkers();
        }
      });
  }


  initMap() {
    if (typeof L === 'undefined') return;
    const container = document.getElementById('dashboard-map');
    if (!container) return;

    this.map = L.map('dashboard-map').setView([SANTA_CRUZ_CENTER.lat, SANTA_CRUZ_CENTER.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMarkers();
  }

  updateMarkers() {
    if (!this.map) return;
    this.markers.forEach(m => m.remove());
    this.markers = [];

    // Marcador del taller
    const t = this.taller();
    if (t && t.lat && t.lng) {
      const tallerIcon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">🔧</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const tallerMarker = L.marker([t.lat, t.lng], { icon: tallerIcon })
        .addTo(this.map)
        .bindPopup(`<b>${t.nombre}</b><br>${t.direccion}`);
      this.markers.push(tallerMarker);
    }

    this.solicitudesPendientes.forEach(s => {
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#2563eb,#22c55e);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;">${s.cliente.nombre[0]}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([s.cliente.lat, s.cliente.lng], { icon })
        .addTo(this.map)
        .on('click', () => this.selectedSolicitud.set(s));
      this.markers.push(marker);
    });
  }

  toggleMapa() {
    this.mapaExpandido.update(v => !v);
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  setDistancia(val: number) {
    this.distanciaMaxima.set(val);
    this.updateMarkers();
  }

  increment() { if (this.distanciaMaxima() < 50) this.setDistancia(this.distanciaMaxima() + 1); }
  decrement() { if (this.distanciaMaxima() > 1) this.setDistancia(this.distanciaMaxima() - 1); }

  selectSolicitud(s: Solicitud) {
    // Navegar a seguimiento en lugar de abrir modal
    this.state.seleccionarSolicitudPendiente(s);
  }
  closeModal() { this.selectedSolicitud.set(null); this.showAnalisisIA.set(false); }

  accept() {
    // Abrir modal de asignación en lugar de aceptar directamente
    const s = this.selectedSolicitud();
    if (s) {
      this.personalSeleccionadoIds.set([]);
      this.asignacionError.set(null);
      this.showAsignacionModal.set(true);
      // Cargar personal disponible
      this.cargarPersonalDisponible();
    }
  }

  cargarPersonalDisponible() {
    this.personalService.listar({ disponibles: true })
      .subscribe({
        next: (data) => this.personal.set(data),
        error: () => this.personal.set([...this.mockData.personal].filter(p => p.estado === 'disponible'))
      });
  }

  togglePersonalSeleccion(personalId: string) {
    this.personalSeleccionadoIds.update(ids => {
      if (ids.includes(personalId)) {
        return ids.filter(id => id !== personalId);
      } else {
        return [...ids, personalId];
      }
    });
  }

  isPersonalSeleccionado(personalId: string): boolean {
    return this.personalSeleccionadoIds().includes(personalId);
  }

  getNombrePersonal(personalId: string): string {
    const p = this.personal().find(p => p.id === personalId);
    return p?.nombre || 'Desconocido';
  }

  confirmarAsignacion() {
    const s = this.selectedSolicitud();
    if (!s) return;

    if (this.personalSeleccionadoIds().length === 0) {
      this.asignacionError.set('Debes seleccionar al menos un técnico');
      return;
    }

    this.asignando.set(true);
    this.asignacionError.set(null);

    this.solicitudesService.asignarPersonal(s.id, this.personalSeleccionadoIds())
      .subscribe({
        next: (solicitudActualizada) => {
          this.asignando.set(false);
          this.showAsignacionModal.set(false);
          this.state.aceptarSolicitud(solicitudActualizada);
          this.selectedSolicitud.set(null);
          this.cargarDatos();
        },
        error: (err) => {
          this.asignando.set(false);
          this.asignacionError.set('Error al asignar: ' + err.message);
        }
      });
  }

  cerrarModalAsignacion() {
    this.showAsignacionModal.set(false);
    this.personalSeleccionadoIds.set([]);
    this.asignacionError.set(null);
  }

  reject() {
    const s = this.selectedSolicitud();
    if (s) {
      this.solicitudesService.cambiarEstado(s.id, 'rechazada')
        .subscribe({
          next: () => {
            this.selectedSolicitud.set(null);
            this.cargarDatos();
          },
          error: (err) => {
            this.error.set('Error al rechazar: ' + err.message);
          }
        });
    }
  }

  toggleAnalisisIA() { this.showAnalisisIA.update(v => !v); }

  // ============ CONTROL DE ESTADOS DEL SERVICIO ============
  actualizandoEstado = signal(false);

  get nextEstado(): { estado: string; label: string; icon: string } | null {
    const s = this.selectedSolicitud();
    if (!s) return null;

    const estados: Record<string, { estado: string; label: string; icon: string }> = {
      'pendiente': { estado: 'aceptada', label: 'Aceptar Solicitud', icon: 'check' },
      'aceptada': { estado: 'en_camino', label: 'Marcar En Camino', icon: 'car' },
      'en_camino': { estado: 'reparando', label: 'Iniciar Reparación', icon: 'wrench' },
      'reparando': { estado: 'finalizada', label: 'Finalizar Servicio', icon: 'check-circle' }
    };

    return estados[s.estado] || null;
  }

  get timelineEstados() {
    return [
      { key: 'aceptada', label: 'Asignado', icon: 'check' },
      { key: 'en_camino', label: 'En Camino', icon: 'car' },
      { key: 'reparando', label: 'Llegada', icon: 'map-pin' },
      { key: 'finalizada', label: 'Reparando', icon: 'wrench' }
    ];
  }

  rolLabel(rol: string) { return ({ mecanico: 'Mecánico', electrico: 'Eléctrico', grua: 'Grúa', administrador: 'Administrador', encargado: 'Encargado' } as any)[rol] ?? rol; }

  get personalDisponiblesPorRol() {
    const porRol: Record<string, Personal[]> = {
      mecanico: [],
      electrico: [],
      grua: [],
      administrador: [],
      encargado: []
    };

    this.personal().forEach(p => {
      if (p.rol in porRol) {
        porRol[p.rol].push(p);
      }
    });

    return porRol;
  }

  isEstadoActive(estadoKey: string): boolean {
    const s = this.selectedSolicitud();
    if (!s) return false;

    const orden = ['aceptada', 'en_camino', 'reparando', 'finalizada'];
    const estadoActualIndex = orden.indexOf(s.estado);
    const estadoCheckIndex = orden.indexOf(estadoKey);

    return estadoActualIndex >= estadoCheckIndex;
  }

  avanzarEstado() {
    const next = this.nextEstado;
    const s = this.selectedSolicitud();
    if (!next || !s) return;

    this.actualizandoEstado.set(true);

    this.solicitudesService.cambiarEstado(s.id, next.estado as any)
      .subscribe({
        next: () => {
          // Actualizar la solicitud localmente
          this.selectedSolicitud.update(sol =>
            sol ? { ...sol, estado: next.estado as any } : null
          );
          // Recargar datos del dashboard
          this.cargarDatos();
          this.actualizandoEstado.set(false);

          // Si se finalizó el servicio, mostrar modal de confirmar pago
          if (next.estado === 'finalizada') {
            setTimeout(() => this.mostrarModalConfirmarPago(), 300);
          }
        },
        error: (err) => {
          this.error.set('Error al actualizar estado: ' + err.message);
          this.actualizandoEstado.set(false);
        }
      });
  }

  cargarPagosRecientes() {
    this.facturasService.listar()
      .subscribe({
        next: (data) => {
          // Tomar los últimos 5 pagos enviados (pagados)
          const pagosCompletados = data.filter(f => f.enviada).slice(0, 5);
          this.pagosRecientes.set(pagosCompletados);
        },
        error: () => {
          this.pagosRecientes.set([...this.mockData.facturas].slice(0, 5));
        }
      });
  }

  cargarIngresosHoy() {
    this.facturasService.getDailyStats()
      .subscribe({
        next: (stats) => {
          this.ingresosHoy.set(stats.ingresos_hoy);
          this.serviciosHoy.set(stats.total_facturas_hoy);
        },
        error: () => {
          // Fallback: calculate from mock data
          this.ingresosHoy.set(1245);
          this.serviciosHoy.set(8);
        }
      });
  }

  navigateToPagos() {
    this.state.navigateTo('pagos');
  }

  getMetodoPagoIcon(metodo: string): string {
    const icons: Record<string, string> = {
      'qr': 'QR',
      'tarjeta': 'Tarjeta',
      'efectivo': 'Efectivo'
    };
    return icons[metodo] || metodo || 'Efectivo';
  }

  getEstadoColor(estado: string): string {
    return estado === 'completado' ? '#22c55e' : '#eab308';
  }

  // ============ MÉTODOS CONFIRMAR PAGO ============
  mostrarModalConfirmarPago() {
    this.showConfirmarPagoModal.set(true);
  }

  cerrarModalConfirmarPago() {
    this.showConfirmarPagoModal.set(false);
  }

  onPagoConfirmado(event: any) {
    this.confirmandoPago.set(false);
    this.showConfirmarPagoModal.set(false);
    this.selectedSolicitud.set(null);
    // Recargar datos para reflejar el cambio
    this.cargarDatos();
    this.cargarIngresosHoy();
    // Mostrar mensaje de éxito
    alert(`Pago confirmado: Bs. ${event.total} (incluye comisión)`);
  }

  onPagoCancelado() {
    this.showConfirmarPagoModal.set(false);
  }

  getEstadoPagoLabel(estadoPago: string | undefined): string {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'confirmado': 'Esperando Pago',
      'completado': 'Pagado',
      'cancelado': 'Cancelado'
    };
    return labels[estadoPago || 'pendiente'] || 'Pendiente';
  }

  getEstadoPagoColor(estadoPago: string | undefined): string {
    const colors: Record<string, string> = {
      'pendiente': '#f59e0b',  // amber
      'confirmado': '#3b82f6',  // blue
      'completado': '#22c55e',  // green
      'cancelado': '#ef4444'    // red
    };
    return colors[estadoPago || 'pendiente'] || '#f59e0b';
  }
}
