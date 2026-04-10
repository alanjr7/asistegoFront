import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { MockDataService, SANTA_CRUZ_CENTER } from '../services/mock-data.service';
import { Solicitud } from '../models/types.model';

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
  mockData = inject(MockDataService);

  solicitudes = signal<Solicitud[]>([]);
  selectedSolicitud = signal<Solicitud | null>(null);
  showAnalisisIA = signal(false);
  distanciaMaxima = signal(10);
  mapaExpandido = signal(false);

  private map: any = null;
  private markers: any[] = [];

  get solicitudesPendientes() {
    return this.solicitudes().filter(s => s.estado === 'pendiente' && s.distancia <= this.distanciaMaxima());
  }

  get solicitudEnCurso() {
    return this.mockData.solicitudes[0];
  }

  get personalPrimero() {
    return this.mockData.personal[0];
  }

  ngOnInit() {
    this.solicitudes.set([...this.mockData.solicitudes]);
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
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

  selectSolicitud(s: Solicitud) { this.selectedSolicitud.set(s); }
  closeModal() { this.selectedSolicitud.set(null); this.showAnalisisIA.set(false); }

  accept() {
    const s = this.selectedSolicitud();
    if (s) {
      this.state.aceptarSolicitud(s);
      this.selectedSolicitud.set(null);
    }
  }

  reject() { this.selectedSolicitud.set(null); }

  toggleAnalisisIA() { this.showAnalisisIA.update(v => !v); }
}
