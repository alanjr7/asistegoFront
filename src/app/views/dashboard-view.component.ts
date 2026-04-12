import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { SolicitudesService } from '../services/solicitudes.service';
import { PersonalService } from '../services/personal.service';
import { MockDataService, SANTA_CRUZ_CENTER } from '../services/mock-data.service';
import { Solicitud, Personal, Factura } from '../models/types.model';
import { FacturasService } from '../services/facturas.service';

declare const L: any;

@Component({
  selector: 'app-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.css'],
})
export class DashboardViewComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  solicitudesService = inject(SolicitudesService);
  personalService = inject(PersonalService);
  facturasService = inject(FacturasService);
  mockData = inject(MockDataService);

  solicitudes = signal<Solicitud[]>([]);
  personal = signal<Personal[]>([]);
  pagosRecientes = signal<Factura[]>([]);
  selectedSolicitud = signal<Solicitud | null>(null);
  showAnalisisIA = signal(false);
  distanciaMaxima = signal(10);
  mapaExpandido = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  ingresosHoy = signal<number>(0);
  serviciosHoy = signal<number>(0);

  private map: any = null;
  private markers: any[] = [];

  get solicitudesPendientes() {
    return this.solicitudes().filter(s => s.estado === 'pendiente' && s.distancia <= this.distanciaMaxima());
  }

  get solicitudEnCurso() {
    return this.solicitudes()[0] || this.mockData.solicitudes[0];
  }

  get personalPrimero() {
    return this.personal()[0] || this.mockData.personal[0];
  }

  private refreshInterval: any;

  ngOnInit() {
    this.cargarDatos();
    this.cargarPagosRecientes();
    this.cargarIngresosHoy();
    setTimeout(() => this.initMap(), 100);

    // Auto-refresh every 30 seconds to detect new payments
    this.refreshInterval = setInterval(() => {
      this.cargarIngresosHoy();
      this.cargarPagosRecientes();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarDatos() {
    this.loading.set(true);
    this.solicitudesService.listar({ pendientes: true })
      .subscribe({
        next: (data) => {
          this.solicitudes.set(data);
          this.loading.set(false);
          setTimeout(() => this.updateMarkers(), 0);
        },
        error: (err) => {
          this.error.set('Error al cargar solicitudes: ' + err.message);
          this.loading.set(false);
          this.solicitudes.set([...this.mockData.solicitudes]);
        }
      });
    
    this.personalService.listar({ disponibles: true })
      .subscribe({
        next: (data) => this.personal.set(data),
        error: () => this.personal.set([...this.mockData.personal])
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
    const s = this.selectedSolicitud();
    if (s) {
      this.solicitudesService.cambiarEstado(s.id, 'aceptada')
        .subscribe({
          next: () => {
            this.state.aceptarSolicitud(s);
            this.selectedSolicitud.set(null);
            this.cargarDatos();
          },
          error: (err) => {
            this.error.set('Error al aceptar: ' + err.message);
          }
        });
    }
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
      'pendiente': { estado: 'aceptada', label: 'Aceptar Solicitud', icon: '✓' },
      'aceptada': { estado: 'en_camino', label: 'Marcar En Camino', icon: '🚗' },
      'en_camino': { estado: 'reparando', label: 'Iniciar Reparación', icon: '🔧' },
      'reparando': { estado: 'finalizada', label: 'Finalizar Servicio', icon: '✅' }
    };

    return estados[s.estado] || null;
  }

  get timelineEstados() {
    return [
      { key: 'aceptada', label: 'Asignado', icon: '✓' },
      { key: 'en_camino', label: 'En Camino', icon: '🚗' },
      { key: 'reparando', label: 'Llegada', icon: '📍' },
      { key: 'finalizada', label: 'Reparando', icon: '🔧' }
    ];
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
      'qr': '📱',
      'tarjeta': '💳',
      'efectivo': '💵'
    };
    return icons[metodo] || '💰';
  }

  getEstadoColor(estado: string): string {
    return estado === 'completado' ? '#22c55e' : '#eab308';
  }
}
