import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service'; 
// Nota: Si 'views' y 'services' están dentro de 'app', solo lleva un juego de puntos '../'
import { MockDataService, SANTA_CRUZ_CENTER } from '../services/mock-data.service';
import { Solicitud, Personal, Cliente, Servicio, Notificacion, MensajeChat, Repuesto, SolicitudRepuesto, Factura } from '../models/types.model';

// ==================== CHAT VIEW ====================
@Component({
  selector: 'app-chat-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="view-layout">
  <!-- Lista clientes -->
  <div class="chat-list card">
    <div class="list-header"><h3>Conversaciones</h3></div>
    <div>
      <button *ngFor="let c of mockData.clientes" (click)="clienteSeleccionado.set(c)"
        class="chat-item" [class.active]="clienteSeleccionado().id === c.id">
        <img [src]="c.foto" [alt]="c.nombre" class="av48" />
        <div class="chat-item-info">
          <p class="font-medium text-gray-900 truncate">{{ c.nombre }}</p>
          <p class="text-sm text-gray-500 truncate">Última conversación</p>
        </div>
        <div *ngIf="clienteSeleccionado().id !== c.id" class="unread-dot"></div>
      </button>
    </div>
  </div>

  <!-- Chat -->
  <div class="chat-main card">
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <img [src]="clienteSeleccionado().foto" [alt]="clienteSeleccionado().nombre" class="av40" />
        <div>
          <p class="font-medium text-gray-900">{{ clienteSeleccionado().nombre }}</p>
          <p class="text-sm text-gray-500">{{ clienteSeleccionado().telefono }}</p>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem">
        <button class="btn btn-outline btn-sm" (click)="consultarIA()">✨ Consultar IA</button>
        <button class="btn btn-outline btn-sm">📞 Llamar</button>
      </div>
    </div>

    <div class="messages-area">
      <div *ngFor="let m of mensajes()" class="msg-row" [class.msg-taller]="m.emisor === 'taller'">
        <div class="msg-bubble" [class.bubble-taller]="m.emisor === 'taller'" [class.bubble-cliente]="m.emisor === 'cliente'">
          <p *ngIf="m.tipo === 'texto'" class="text-sm" style="white-space:pre-wrap">{{ m.contenido }}</p>
          <div *ngIf="m.tipo === 'audio'" class="audio-msg">
            <button class="audio-play-btn" (click)="togglePlay(m.id)">
              {{ reproduciendo() === m.id ? '⏸' : '▶' }}
            </button>
            <div class="audio-wave">
              <div *ngFor="let _ of waveArr" class="wave-bar" [style.height.px]="getRandHeight()"></div>
            </div>
            <span class="text-xs">0:15</span>
          </div>
          <div *ngIf="m.transcripcion" class="transcription">
            <p style="font-size:0.65rem;margin-bottom:0.25rem">✨ Transcripción:</p>
            <p class="text-xs">{{ m.transcripcion }}</p>
          </div>
          <p class="msg-time">{{ m.timestamp | date:'HH:mm' }}</p>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <button class="btn btn-outline btn-icon" [class.recording]="grabando()" (click)="grabar()">🎙️</button>
      <textarea class="input" [(ngModel)]="nuevoMensaje" [disabled]="grabando()"
        [placeholder]="grabando() ? 'Grabando...' : 'Escribe un mensaje...'"
        rows="2" style="resize:none;flex:1" (keydown.enter)="enviar($event)"></textarea>
      <button class="btn btn-primary btn-icon" (click)="enviar()" [disabled]="!nuevoMensaje.trim() || grabando()">
        ➤
      </button>
    </div>
  </div>
</div>`,
  styles: [`
.view-layout { display:flex; gap:1rem; padding:1.5rem; height:100%; overflow:hidden; }
.chat-list { width:320px; display:flex; flex-direction:column; overflow:hidden; flex-shrink:0; }
.list-header { padding:1rem; border-bottom:1px solid #e5e7eb; }
.chat-item { width:100%; padding:1rem; display:flex; align-items:center; gap:0.75rem; border:none; background:transparent; cursor:pointer; text-align:left; transition:background 0.15s; }
.chat-item:hover { background:#f9fafb; }
.chat-item.active { background:#eff6ff; }
.chat-item-info { flex:1; min-width:0; }
.unread-dot { width:8px; height:8px; background:#2563eb; border-radius:50%; flex-shrink:0; }
.chat-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.chat-header { padding:1rem; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
.messages-area { flex:1; padding:1rem; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; }
.msg-row { display:flex; }
.msg-taller { justify-content:flex-end; }
.msg-bubble { max-width:70%; padding:0.75rem; border-radius:0.75rem; }
.bubble-taller { background:linear-gradient(to right,#2563eb,#22c55e); color:white; }
.bubble-cliente { background:#f3f4f6; color:#111827; }
.msg-time { font-size:0.65rem; margin-top:0.25rem; opacity:0.7; }
.audio-msg { display:flex; align-items:center; gap:0.5rem; }
.audio-play-btn { width:36px; height:36px; border-radius:50%; border:none; background:rgba(255,255,255,0.2); color:inherit; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.audio-wave { display:flex; gap:2px; align-items:center; flex:1; height:32px; }
.wave-bar { width:3px; border-radius:2px; background:currentColor; opacity:0.8; }
.transcription { margin-top:0.5rem; padding:0.5rem; border-radius:0.375rem; background:rgba(255,255,255,0.15); }
.chat-input { padding:1rem; border-top:1px solid #e5e7eb; display:flex; gap:0.5rem; flex-shrink:0; }
.recording { background:#ef4444 !important; color:white !important; }
.av48 { width:48px; height:48px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.av40 { width:40px; height:40px; border-radius:50%; object-fit:cover; flex-shrink:0; }
  `]
})
export class ChatViewComponent {
  state = inject(AppStateService);
  mockData = inject(MockDataService);
  waveArr = new Array(20);

  clienteSeleccionado = signal(this.mockData.clientes[0]);
  nuevoMensaje = '';
  grabando = signal(false);
  reproduciendo = signal<string | null>(null);

  mensajes = signal<MensajeChat[]>([
    { id: '1', emisor: 'cliente', contenido: 'Hola, ya estás en camino?', timestamp: new Date(Date.now() - 600000), tipo: 'texto' },
    { id: '2', emisor: 'taller', contenido: 'Sí, llegaré en aproximadamente 15 minutos', timestamp: new Date(Date.now() - 480000), tipo: 'texto' },
    { id: '3', emisor: 'cliente', contenido: 'El auto hace un ruido extrano', timestamp: new Date(Date.now() - 300000), tipo: 'audio', audio: 'url', transcripcion: 'El auto hace un ruido extrano cuando acelero' },
  ]);

  getRandHeight() { return Math.random() * 16 + 8; }

  enviar(e?: any) {
    if (e instanceof KeyboardEvent) { if (!e.shiftKey) { e.preventDefault(); } else return; }
    if (!this.nuevoMensaje.trim() || this.grabando()) return;
    this.mensajes.update(m => [...m, { id: Date.now().toString(), emisor: 'taller', contenido: this.nuevoMensaje, timestamp: new Date(), tipo: 'texto' }]);
    this.nuevoMensaje = '';
  }

  grabar() {
    if (!this.grabando()) {
      this.grabando.set(true);
      setTimeout(() => {
        this.mensajes.update(m => [...m, { id: Date.now().toString(), emisor: 'taller', contenido: 'Audio de voz', timestamp: new Date(), tipo: 'audio', audio: 'url' }]);
        this.grabando.set(false);
      }, 3000);
    }
  }

  togglePlay(id: string) {
    if (this.reproduciendo() === id) { this.reproduciendo.set(null); }
    else { this.reproduciendo.set(id); setTimeout(() => this.reproduciendo.set(null), 3000); }
  }

  consultarIA() {
    this.mensajes.update(m => [...m, { id: Date.now().toString(), emisor: 'taller', contenido: `🤖 IA: Basándome en la descripción, te sugiero verificar:\n1. Rodamientos de ruedas\n2. Sistema de suspensión\n3. Balance de neumáticos`, timestamp: new Date(), tipo: 'texto' }]);
  }
}

// ==================== SEGUIMIENTO VIEW ====================
@Component({
  selector: 'app-seguimiento-view',
  standalone: true,
  imports: [CommonModule],
  template: `
<ng-container *ngIf="!state.solicitudActiva(); else conSolicitud">
  <div class="empty-state">
    <div class="empty-icon">🚗</div>
    <h3>No hay servicio activo</h3>
    <p class="text-sm text-gray-500">Acepta una solicitud desde el Dashboard</p>
  </div>
</ng-container>

<ng-template #conSolicitud>
  <div class="seg-layout">
    <!-- Mapa -->
    <div class="seg-map-section">
      <div class="card seg-map-card">
        <div id="seg-map" class="leaflet-map"></div>
        <div *ngIf="hasLlegado" class="llegada-msg card">📍 Has llegado a la ubicación</div>
      </div>
    </div>

    <!-- Panel info -->
    <div class="seg-panel">
      <!-- Cliente info -->
      <div class="card" style="padding:1rem">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <img [src]="state.solicitudActiva()!.cliente.foto" class="av48" />
            <div>
              <p class="font-medium text-gray-900">{{ state.solicitudActiva()!.cliente.nombre }}</p>
              <p class="text-sm text-gray-500">{{ state.solicitudActiva()!.distancia }} km</p>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" (click)="state.navigateTo('chat')">💬</button>
        </div>
        <div class="text-sm" style="display:flex;flex-direction:column;gap:0.5rem">
          <div style="display:flex;align-items:center;gap:0.5rem">
            🚗 <span>{{ state.solicitudActiva()!.vehiculo.marca }} {{ state.solicitudActiva()!.vehiculo.modelo }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;color:#6b7280">
            📍 <span>{{ state.solicitudActiva()!.cliente.lat.toFixed(4) }}, {{ state.solicitudActiva()!.cliente.lng.toFixed(4) }}</span>
          </div>
        </div>
        <button class="btn btn-outline" style="width:100%;margin-top:1rem">
          📞 {{ state.solicitudActiva()!.cliente.telefono }}
        </button>
      </div>

      <!-- Estados -->
      <div class="card" style="padding:1rem">
        <h3 class="text-sm text-gray-500" style="margin-bottom:1rem">Estado del servicio</h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <button *ngFor="let est of estados; let i = index"
            (click)="cambiarEstado(est.id, i)"
            [disabled]="!isAvailable(i)"
            class="estado-btn"
            [class.estado-active]="estadoActual() === est.id"
            [class.estado-done]="isDone(i)"
            [class.estado-disabled]="!isAvailable(i)">
            <div class="estado-icon-wrap" [class.icon-active]="estadoActual() === est.id" [class.icon-done]="isDone(i)">
              {{ est.emoji }}
            </div>
            <span style="flex:1">{{ est.label }}</span>
            <span *ngIf="isDone(i) && estadoActual() !== est.id">✓</span>
          </button>
        </div>
      </div>

      <!-- Problema -->
      <div class="card" style="padding:1rem">
        <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem">Problema reportado</h3>
        <p class="text-gray-900">{{ state.solicitudActiva()!.descripcion }}</p>
        <span *ngIf="state.solicitudActiva()!.requiereRepuestos" class="badge badge-secondary" style="margin-top:0.5rem">Requiere repuestos</span>
      </div>

      <!-- Imágenes -->
      <div *ngIf="state.solicitudActiva()!.imagenes" class="card" style="padding:1rem">
        <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem">Imágenes del vehículo</h3>
        <div class="img-grid-sm">
          <img *ngFor="let img of state.solicitudActiva()!.imagenes" [src]="img" alt="img" class="img-sm" />
        </div>
      </div>

      <button *ngIf="estadoActual() === 'en_reparacion'" class="btn btn-primary" style="width:100%" (click)="finalizar()">
        ✓ Finalizar Servicio
      </button>
    </div>
  </div>
</ng-template>`,
  styles: [`
.empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.5rem; }
.empty-icon { font-size:4rem; opacity:0.3; }
.seg-layout { display:flex; gap:1rem; padding:1.5rem; height:100%; overflow:hidden; }
.seg-map-section { flex:1; }
.seg-map-card { height:100%; overflow:hidden; }
.leaflet-map { width:100%; height:100%; min-height:400px; }
.llegada-msg { position:absolute; top:1rem; left:50%; transform:translateX(-50%); background:#22c55e; color:white; padding:0.5rem 1rem; border-color:#16a34a; z-index:400; }
.seg-panel { width:384px; flex-shrink:0; display:flex; flex-direction:column; gap:1rem; overflow-y:auto; }
.av48 { width:48px; height:48px; border-radius:50%; object-fit:cover; }
.estado-btn { width:100%; display:flex; align-items:center; gap:0.75rem; padding:0.75rem; border-radius:0.5rem; border:none; cursor:pointer; transition:all 0.15s; text-align:left; background:#f9fafb; color:#374151; }
.estado-btn:hover:not(:disabled) { background:#f3f4f6; }
.estado-active { background:linear-gradient(to right,#2563eb,#22c55e) !important; color:white !important; box-shadow:0 4px 12px rgba(37,99,235,0.3); }
.estado-done { background:#f0fdf4 !important; color:#15803d !important; }
.estado-disabled { opacity:0.5; cursor:not-allowed !important; }
.estado-icon-wrap { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#e5e7eb; }
.icon-active { background:rgba(255,255,255,0.2) !important; }
.icon-done { background:#dcfce7 !important; }
.img-grid-sm { display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; }
.img-sm { width:100%; height:96px; object-fit:cover; border-radius:0.5rem; }
  `]
})
export class SeguimientoViewComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  estadoActual = signal('en_camino');
  private map: any = null;

  estados = [
    { id: 'aceptada', label: 'Aceptada', emoji: '✓' },
    { id: 'en_camino', label: 'En camino', emoji: '🚗' },
    { id: 'en_reparacion', label: 'Reparando', emoji: '🔧' },
    { id: 'finalizada', label: 'Finalizada', emoji: '✅' },
  ];

  get hasLlegado() { return this.estadoActual() === 'en_reparacion' || this.estadoActual() === 'finalizada'; }

  currentIndex() { return this.estados.findIndex(e => e.id === this.estadoActual()); }
  isDone(i: number) { return this.currentIndex() > i; }
  isAvailable(i: number) { return this.currentIndex() >= i - 1; }

  ngOnInit() {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy() { if (this.map) { this.map.remove(); this.map = null; } }

  initMap() {
    if (typeof (window as any).L === 'undefined') return;
    const L = (window as any).L;
    const s = this.state.solicitudActiva();
    const container = document.getElementById('seg-map');
    if (!container || !s) return;
    this.map = L.map('seg-map').setView([s.cliente.lat, s.cliente.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);
    const icon = (window as any).L.divIcon({ html: `<div style="width:32px;height:32px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`, className:'', iconSize:[32,32], iconAnchor:[16,16] });
    L.marker([s.cliente.lat, s.cliente.lng], { icon }).addTo(this.map).bindPopup(s.cliente.nombre);
  }

  cambiarEstado(id: string, i: number) {
    if (!this.isAvailable(i)) return;
    this.estadoActual.set(id);
    if (id === 'finalizada') this.state.navigateTo('pagos');
  }

  finalizar() { this.cambiarEstado('finalizada', 3); }
}

// ==================== PAGOS VIEW ====================
@Component({
  selector: 'app-pagos-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="view-padded">
  <!-- Stats -->
  <div class="stats3">
    <div *ngFor="let s of resumen" class="card" style="padding:1rem">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <div class="stat-icon" [style.background]="s.bg">{{ s.icon }}</div>
        <div>
          <p class="text-sm text-gray-500">{{ s.label }}</p>
          <p class="font-medium text-gray-900">Bs. {{ s.monto.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs-list">
    <button class="tabs-trigger" [class.active]="tab() === 'confirmar'" (click)="tab.set('confirmar')">Confirmar Pago</button>
    <button class="tabs-trigger" [class.active]="tab() === 'facturas'" (click)="tab.set('facturas')">Facturas</button>
    <button class="tabs-trigger" [class.active]="tab() === 'reportes'" (click)="tab.set('reportes')">Reportes</button>
  </div>

  <!-- Confirmar -->
  <div *ngIf="tab() === 'confirmar'">
    <div *ngIf="state.solicitudActiva(); else noServicio" class="card" style="padding:1.5rem">
      <h3 style="margin-bottom:1rem">Confirmar Pago de Servicio</h3>
      <div class="bg-gray-50 rounded-lg" style="padding:1rem;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
          <img [src]="state.solicitudActiva()!.cliente.foto" class="av40" />
          <div>
            <p class="font-medium text-gray-900">{{ state.solicitudActiva()!.cliente.nombre }}</p>
            <p class="text-sm text-gray-500">{{ state.solicitudActiva()!.vehiculo.marca }} {{ state.solicitudActiva()!.vehiculo.modelo }}</p>
          </div>
        </div>
        <p class="text-sm text-gray-600">{{ state.solicitudActiva()!.problema }}</p>
      </div>
      <div style="margin-bottom:1rem">
        <label class="label">Monto del servicio (Bs.)</label>
        <input type="number" [(ngModel)]="monto" class="input" placeholder="0.00" style="margin-top:0.25rem" />
      </div>
      <div style="margin-bottom:1rem">
        <label class="label">Método de Pago</label>
        <select [(ngModel)]="metodoPago" class="select" style="margin-top:0.25rem">
          <option value="qr">QR</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="efectivo">Efectivo</option>
        </select>
      </div>
      <div *ngIf="+monto > 0" class="resumen-pago">
        <div class="resumen-row"><span>Monto:</span><span>Bs. {{ (+monto).toFixed(2) }}</span></div>
        <div class="resumen-row"><span>Comisión (10%):</span><span>Bs. {{ (+monto * 0.1).toFixed(2) }}</span></div>
        <hr class="separator" /><div class="resumen-row font-medium"><span>Total:</span><span>Bs. {{ (+monto * 1.1).toFixed(2) }}</span></div>
      </div>
      <div style="margin-bottom:1rem">
        <label class="label">Comprobante del cliente</label>
        <div style="margin-top:0.25rem">
          <button *ngIf="!comprobanteSubido" class="btn btn-outline" style="width:100%" (click)="comprobanteSubido = true">📄 Subir comprobante</button>
          <div *ngIf="comprobanteSubido" class="comprobante-ok">✓ Comprobante recibido</div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%" [disabled]="!monto || !comprobanteSubido" (click)="confirmarPago()">
        ✓ Confirmar Pago y Generar Factura
      </button>
    </div>
    <ng-template #noServicio>
      <div class="card empty-state-card">
        <div style="font-size:3rem;opacity:0.3;margin-bottom:1rem">💰</div>
        <h3>No hay servicio activo</h3>
        <p class="text-sm text-gray-500">Los pagos se confirman después de finalizar un servicio</p>
      </div>
    </ng-template>
  </div>

  <!-- Facturas -->
  <div *ngIf="tab() === 'facturas'" class="card" style="padding:1.5rem">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <h3>Facturas Generadas</h3>
      <button class="btn btn-outline btn-sm">📄 Emitir Nueva</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <div *ngFor="let f of facturas" class="factura-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <img [src]="f.cliente.foto" class="av40" />
            <div>
              <p class="font-medium text-gray-900">{{ f.cliente.nombre }}</p>
              <p class="text-sm text-gray-500">{{ f.fecha | date:'dd/MM/yyyy' }} {{ f.fecha | date:'HH:mm' }}</p>
            </div>
          </div>
          <div style="text-align:right">
            <p class="font-medium">Bs. {{ f.monto.toFixed(2) }}</p>
            <span class="badge badge-outline" [style.color]="f.enviada ? '#16a34a' : '#ca8a04'" [style.border-color]="f.enviada ? '#16a34a' : '#ca8a04'">
              {{ f.enviada ? 'Enviada' : 'Pendiente' }}
            </span>
          </div>
        </div>
        <div class="factura-grid">
          <div><span class="text-gray-500 text-xs">Método:</span><p class="text-sm">{{ f.metodoPago.toUpperCase() }}</p></div>
          <div><span class="text-gray-500 text-xs">Comisión:</span><p class="text-sm">Bs. {{ f.comision.toFixed(2) }}</p></div>
          <div><span class="text-gray-500 text-xs">Total:</span><p class="text-sm">Bs. {{ f.total.toFixed(2) }}</p></div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button class="btn btn-outline btn-sm" style="flex:1">👁 Ver</button>
          <button *ngIf="!f.enviada" class="btn btn-primary btn-sm" style="flex:1">📤 Enviar</button>
          <button class="btn btn-outline btn-sm">🖨</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Reportes -->
  <div *ngIf="tab() === 'reportes'" class="card" style="padding:1.5rem">
    <h3 style="margin-bottom:1rem">Exportar Reportes</h3>
    <div style="margin-bottom:1rem">
      <label class="label">Período</label>
      <select class="select" style="margin-top:0.25rem">
        <option value="hoy">Hoy</option><option value="semana">Esta Semana</option><option value="mes">Este Mes</option>
      </select>
    </div>
    <hr class="separator" style="margin:1rem 0" />
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <button class="btn btn-outline" style="justify-content:flex-start">📄 Exportar como PDF</button>
      <button class="btn btn-outline" style="justify-content:flex-start">📊 Exportar como Excel</button>
      <button class="btn btn-outline" style="justify-content:flex-start">🖨 Formato Imprimible</button>
    </div>
    <div class="ia-panel" style="margin-top:1rem">
      <h4 class="text-sm font-medium" style="margin-bottom:0.5rem">Resumen</h4>
      <div class="text-sm" style="display:flex;flex-direction:column;gap:0.25rem">
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Facturas:</span><span>{{ facturas.length }}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Ingresos:</span><span>Bs. {{ ingresosTotal.toFixed(2) }}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Comisiones:</span><span>Bs. {{ (ingresosTotal * 0.1).toFixed(2) }}</span></div>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.view-padded { flex:1; padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; overflow-y:auto; }
.stats3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.stat-icon { width:48px; height:48px; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
.resumen-pago { background:#eff6ff; border:1px solid #bfdbfe; border-radius:0.5rem; padding:1rem; margin-bottom:1rem; display:flex; flex-direction:column; gap:0.5rem; }
.resumen-row { display:flex; justify-content:space-between; font-size:0.875rem; }
.comprobante-ok { display:flex; align-items:center; gap:0.5rem; padding:0.75rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:0.5rem; color:#15803d; font-size:0.875rem; }
.factura-item { background:#f9fafb; border-radius:0.5rem; padding:1rem; }
.factura-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; }
.empty-state-card { padding:3rem; text-align:center; display:flex; flex-direction:column; align-items:center; }
.ia-panel { background:linear-gradient(135deg,#eff6ff,#f0fdf4); padding:1rem; border-radius:0.5rem; }
.av40 { width:40px; height:40px; border-radius:50%; object-fit:cover; }
.bg-gray-50 { background:#f9fafb; } .rounded-lg { border-radius:0.5rem; }
  `]
})
export class PagosViewComponent {
  state = inject(AppStateService);
  mockData = inject(MockDataService);
  tab = signal('confirmar');
  monto = '';
  metodoPago = 'qr';
  comprobanteSubido = false;
  facturas = this.mockData.facturas;

  get ingresosTotal() { return this.facturas.reduce((s, f) => s + f.monto, 0); }

  resumen = [
    { icon: '📱', label: 'Pagos por QR', bg: '#dcfce7', monto: this.mockData.facturas.filter(f => f.metodoPago === 'qr').reduce((s, f) => s + f.monto, 0) },
    { icon: '💳', label: 'Pagos con Tarjeta', bg: '#dbeafe', monto: this.mockData.facturas.filter(f => f.metodoPago === 'tarjeta').reduce((s, f) => s + f.monto, 0) },
    { icon: '💰', label: 'Ingresos Totales del Día', bg: 'linear-gradient(135deg,#2563eb,#22c55e)', monto: this.mockData.facturas.reduce((s, f) => s + f.monto, 0) },
  ];

  confirmarPago() {
    this.state.confirmarPago();
    this.monto = '';
    this.comprobanteSubido = false;
  }
}

// ==================== REPUESTOS VIEW ====================
@Component({
  selector: 'app-repuestos-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="view-padded">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div><h2>Marketplace de Repuestos</h2><p class="text-sm text-gray-500">Gestiona tu inventario y solicitudes de clientes</p></div>
    <button class="btn btn-primary">+ Agregar Repuesto</button>
  </div>

  <div class="tabs-list">
    <button class="tabs-trigger" [class.active]="tab() === 'inventario'" (click)="tab.set('inventario')">Mi Inventario</button>
    <button class="tabs-trigger" [class.active]="tab() === 'solicitudes'" (click)="tab.set('solicitudes')">
      Solicitudes de Clientes
      <span *ngIf="pendienteCount > 0" class="badge badge-red" style="margin-left:0.5rem">{{ pendienteCount }}</span>
    </button>
  </div>

  <!-- Inventario -->
  <ng-container *ngIf="tab() === 'inventario'">
    <div class="card" style="padding:1rem">
      <div style="display:flex;gap:0.75rem">
        <div style="flex:1;position:relative">
          <span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af">🔍</span>
          <input class="input" [(ngModel)]="busqueda" placeholder="Buscar repuestos..." style="padding-left:2.25rem" />
        </div>
        <select class="select" [(ngModel)]="categoria" style="width:200px">
          <option value="todas">Todas las categorías</option>
          <option *ngFor="let c of categorias.slice(1)" [value]="c">{{ c }}</option>
        </select>
      </div>
    </div>

    <div class="repuestos-grid">
      <div *ngFor="let r of repuestosFiltrados" class="card rep-card">
        <img *ngIf="r.imagen" [src]="r.imagen" [alt]="r.nombre" class="rep-img" />
        <div *ngIf="!r.imagen" class="rep-placeholder">📦</div>
        <div style="padding:1rem">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.5rem">
            <div>
              <p class="font-medium text-gray-900" style="margin-bottom:0.25rem">{{ r.nombre }}</p>
              <span class="badge badge-outline text-xs">{{ r.categoria }}</span>
            </div>
            <span class="badge" [class.badge-green]="r.disponible" [class.badge-secondary]="!r.disponible">
              {{ r.disponible ? 'Disponible' : 'Agotado' }}
            </span>
          </div>
          <p class="text-sm text-gray-600" style="margin-bottom:0.75rem">{{ r.descripcion }}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
            <span class="font-medium text-gray-900">Bs. {{ r.precio }}</span>
            <span class="text-xs text-gray-500">{{ r.marca }}</span>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-outline btn-sm" style="flex:1">Editar</button>
            <button class="btn btn-outline btn-sm" style="flex:1" [disabled]="false">
              {{ r.disponible ? 'Marcar agotado' : 'Marcar disponible' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </ng-container>

  <!-- Solicitudes -->
  <ng-container *ngIf="tab() === 'solicitudes'">
    <div *ngFor="let sol of mockData.solicitudesRepuesto" class="card" style="padding:1.5rem">
      <ng-container *ngIf="getRepuesto(sol.repuestoId) as r">
        <div style="display:flex;gap:1.5rem">
          <div style="flex-shrink:0">
            <img *ngIf="r.imagen" [src]="r.imagen" [alt]="r.nombre" style="width:128px;height:128px;object-fit:cover;border-radius:0.5rem" />
            <div *ngIf="!r.imagen" style="width:128px;height:128px;background:#f3f4f6;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;font-size:3rem">📦</div>
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem">
              <div><h3>{{ r.nombre }}</h3><p class="text-sm text-gray-500">Cliente #{{ sol.clienteId }}</p></div>
              <span class="badge" [class.badge-yellow]="sol.estado === 'pendiente'" [class.badge-green]="sol.estado === 'aceptada'">{{ sol.estado }}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
              <div><p class="text-xs text-gray-500">Vehículo</p><p class="text-sm">{{ sol.vehiculo.marca }} {{ sol.vehiculo.modelo }} {{ sol.vehiculo.anio }}</p></div>
              <div><p class="text-xs text-gray-500">Cantidad</p><p class="text-sm">{{ sol.cantidad }} unidad(es)</p></div>
              <div><p class="text-xs text-gray-500">Precio</p><p class="text-sm">Bs. {{ r.precio }}</p></div>
              <div><p class="text-xs text-gray-500">Total</p><p class="text-sm">Bs. {{ r.precio * sol.cantidad }}</p></div>
            </div>
            <div *ngIf="sol.estado === 'pendiente'" style="display:flex;gap:0.5rem">
              <button class="btn btn-outline" style="flex:1">✕ Rechazar</button>
              <button class="btn btn-primary" style="flex:1" [disabled]="!r.disponible">✓ Aceptar</button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </ng-container>
</div>`,
  styles: [`
.view-padded { flex:1; padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; overflow-y:auto; }
.repuestos-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.rep-card { overflow:hidden; }
.rep-img { width:100%; height:192px; object-fit:cover; }
.rep-placeholder { width:100%; height:192px; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-size:4rem; }
.badge-yellow { background:#eab308; color:white; }
  `]
})
export class RepuestosViewComponent {
  mockData = inject(MockDataService);
  tab = signal('inventario');
  busqueda = '';
  categoria = 'todas';

  get categorias() { return ['todas', ...Array.from(new Set(this.mockData.repuestos.map(r => r.categoria)))]; }
  get repuestosFiltrados() {
    return this.mockData.repuestos.filter(r => {
      const mb = r.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) || r.descripcion.toLowerCase().includes(this.busqueda.toLowerCase());
      const mc = this.categoria === 'todas' || r.categoria === this.categoria;
      return mb && mc;
    });
  }
  get pendienteCount() { return this.mockData.solicitudesRepuesto.filter(s => s.estado === 'pendiente').length; }
  getRepuesto(id: string) { return this.mockData.repuestos.find(r => r.id === id); }
}

// ==================== CLIENTES VIEW ====================
@Component({
  selector: 'app-clientes-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="view-layout">
  <!-- Lista clientes -->
  <div class="card" style="width:384px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden">
    <div style="padding:1rem;border-bottom:1px solid #e5e7eb">
      <h3 style="margin-bottom:0.75rem">Clientes</h3>
      <div style="position:relative">
        <span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af">🔍</span>
        <input class="input" [(ngModel)]="busqueda" placeholder="Buscar cliente..." style="padding-left:2.25rem" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto">
      <button *ngFor="let c of filtrados" (click)="seleccionado.set(c)"
        style="width:100%;padding:1rem;display:flex;align-items:center;gap:0.75rem;border:none;background:transparent;cursor:pointer;text-align:left;transition:background 0.15s"
        [style.background]="seleccionado()?.id === c.id ? '#eff6ff' : 'transparent'">
        <img [src]="c.foto" [alt]="c.nombre" style="width:48px;height:48px;border-radius:50%;object-fit:cover" />
        <div style="flex:1;min-width:0">
          <p class="font-medium text-gray-900 truncate">{{ c.nombre }}</p>
          <p class="text-sm text-gray-500 truncate">{{ c.telefono }}</p>
        </div>
      </button>
    </div>
  </div>

  <!-- Detalle -->
  <div style="flex:1;overflow-y:auto" *ngIf="seleccionado(); else noSeleccionado">
    <div style="display:flex;flex-direction:column;gap:1rem">
      <div class="card" style="padding:1.5rem">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem">
          <div style="display:flex;align-items:center;gap:1rem">
            <img [src]="seleccionado()!.foto" class="av80" />
            <div>
              <h2 style="margin-bottom:0.25rem">{{ seleccionado()!.nombre }}</h2>
              <p class="text-sm text-gray-500">📞 {{ seleccionado()!.telefono }}</p>
              <p class="text-sm text-gray-500" style="margin-top:0.25rem">📍 Santa Cruz, Bolivia</p>
            </div>
          </div>
          <button class="btn btn-outline">📞 Llamar</button>
        </div>
        <hr class="separator" style="margin-bottom:1rem" />
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
          <div class="stat-box"><p class="text-2xl text-gray-900" style="margin-bottom:0.25rem">{{ serviciosCliente.length }}</p><p class="text-sm text-gray-500">Servicios</p></div>
          <div class="stat-box"><p class="text-2xl text-gray-900" style="margin-bottom:0.25rem">Bs. {{ totalGastado }}</p><p class="text-sm text-gray-500">Total gastado</p></div>
          <div class="stat-box"><p class="text-2xl text-gray-900" style="margin-bottom:0.25rem">4.8 ⭐</p><p class="text-sm text-gray-500">Calificación</p></div>
        </div>
      </div>
      <div class="card" style="padding:1.5rem">
        <h3 style="margin-bottom:1rem">📋 Historial de Servicios</h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <div *ngFor="let s of serviciosCliente" class="srv-item">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem">
              <div style="display:flex;align-items:center;gap:0.75rem">
                <div class="srv-icon bg-gradient-to-br-blue-green">🚗</div>
                <div><p class="font-medium text-gray-900">{{ s.problema }}</p><p class="text-sm text-gray-500">{{ s.vehiculo.marca }} {{ s.vehiculo.modelo }}</p></div>
              </div>
              <span class="badge badge-outline text-green-600" style="border-color:#16a34a">Completado</span>
            </div>
            <p class="text-sm text-gray-600" style="margin-bottom:0.75rem">{{ s.solucion }}</p>
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.875rem">
              <span class="text-gray-500">{{ s.fecha | date:'d MMMM yyyy' }}</span>
              <div style="display:flex;gap:0.75rem"><span class="text-gray-500">{{ s.duracion }} min</span><span class="font-medium">Bs. {{ s.monto }}</span></div>
            </div>
          </div>
          <div *ngIf="serviciosCliente.length === 0" style="text-align:center;padding:2rem;color:#6b7280">Sin servicios registrados</div>
        </div>
      </div>
    </div>
  </div>
  <ng-template #noSeleccionado>
    <div style="flex:1;display:flex;align-items:center;justify-content:center"><div style="text-align:center"><div style="font-size:4rem;opacity:0.3">🚗</div><h3>Selecciona un cliente</h3><p class="text-sm text-gray-500">Elige de la lista para ver su información</p></div></div>
  </ng-template>
</div>`,
  styles: [`
.view-layout { display:flex; gap:1rem; padding:1.5rem; height:100%; overflow:hidden; }
.av80 { width:80px; height:80px; border-radius:50%; object-fit:cover; }
.stat-box { text-align:center; padding:0.75rem; background:#f9fafb; border-radius:0.5rem; }
.srv-item { padding:1rem; background:#f9fafb; border-radius:0.5rem; }
.srv-icon { width:40px; height:40px; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  `]
})
export class ClientesViewComponent {
  mockData = inject(MockDataService);
  busqueda = '';
  seleccionado = signal<Cliente | null>(null);

  get filtrados() { return this.mockData.clientes.filter(c => c.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) || c.telefono.includes(this.busqueda)); }
  get serviciosCliente() { return this.seleccionado() ? this.mockData.servicios.filter(s => s.cliente.id === this.seleccionado()!.id) : []; }
  get totalGastado() { return this.serviciosCliente.reduce((s, v) => s + v.monto, 0); }
}

// ==================== HISTORIAL VIEW ====================
@Component({
  selector: 'app-historial-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="view-padded">
  <div><h2>Historial de Servicios</h2><p class="text-sm text-gray-500">Registro completo de todos los servicios realizados</p></div>

  <div class="stats4">
    <div *ngFor="let s of stats" class="card" style="padding:1rem">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <div class="stat-icon" [style.background]="s.bg" style="width:40px;height:40px;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;font-size:1.25rem">{{ s.icon }}</div>
        <div><p class="text-sm text-gray-500">{{ s.label }}</p><p class="font-medium text-gray-900">{{ s.value }}</p></div>
      </div>
    </div>
  </div>

  <div class="card" style="padding:1rem">
    <div style="display:flex;gap:0.75rem">
      <div style="flex:1;position:relative">
        <span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af">🔍</span>
        <input class="input" [(ngModel)]="busqueda" placeholder="Buscar por cliente, vehículo o problema..." style="padding-left:2.25rem" />
      </div>
      <select class="select" [(ngModel)]="filtroTiempo" style="width:192px">
        <option value="todos">Todos los tiempos</option><option value="hoy">Hoy</option><option value="semana">Última semana</option><option value="mes">Último mes</option>
      </select>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:0.75rem">
    <div *ngFor="let s of filtrados" class="card" style="padding:1.5rem">
      <div style="display:flex;gap:1.5rem">
        <div style="flex-shrink:0;width:64px;height:64px;border-radius:0.75rem;display:flex;align-items:center;justify-content:center;font-size:2rem;background:linear-gradient(135deg,#2563eb,#22c55e)">🚗</div>
        <div style="flex:1">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.75rem">
            <div>
              <h3 style="margin-bottom:0.25rem">{{ s.problema }}</h3>
              <p class="text-sm text-gray-500">🚗 {{ s.vehiculo.marca }} {{ s.vehiculo.modelo }} · {{ s.cliente.nombre }}</p>
            </div>
            <span class="badge badge-outline text-green-600" style="border-color:#16a34a">Completado</span>
          </div>
          <p class="text-sm text-gray-600" style="margin-bottom:1rem">{{ s.solucion }}</p>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;gap:1.5rem;font-size:0.875rem;color:#6b7280">
              <span>📅 {{ s.fecha | date:'d MMMM yyyy' }}</span>
              <span>⏱ {{ s.duracion }} minutos</span>
            </div>
            <div style="text-align:right"><p class="text-xs text-gray-500">Monto</p><p class="font-medium">Bs. {{ s.monto }}</p></div>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="filtrados.length === 0" style="text-align:center;padding:3rem;color:#6b7280">
      <div style="font-size:3rem;margin-bottom:1rem">🚗</div>
      <h3>No se encontraron servicios</h3><p class="text-sm">Ajusta los filtros de búsqueda</p>
    </div>
  </div>
</div>`,
  styles: [`
.view-padded { flex:1; padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; overflow-y:auto; }
.stats4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
  `]
})
export class HistorialViewComponent {
  mockData = inject(MockDataService);
  busqueda = '';
  filtroTiempo = 'todos';

  get filtrados() {
    return this.mockData.servicios.filter(s => {
      const mb = s.cliente.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) || s.problema.toLowerCase().includes(this.busqueda.toLowerCase()) || s.vehiculo.marca.toLowerCase().includes(this.busqueda.toLowerCase());
      let mt = true;
      if (this.filtroTiempo !== 'todos') {
        const dias = Math.floor((Date.now() - s.fecha.getTime()) / 86400000);
        if (this.filtroTiempo === 'hoy') mt = dias === 0;
        else if (this.filtroTiempo === 'semana') mt = dias <= 7;
        else if (this.filtroTiempo === 'mes') mt = dias <= 30;
      }
      return mb && mt;
    });
  }

  get stats() {
    const f = this.filtrados;
    return [
      { icon: '🚗', label: 'Total Servicios', value: f.length, bg: '#dbeafe' },
      { icon: '💰', label: 'Ingresos Totales', value: `Bs. ${f.reduce((s, v) => s + v.monto, 0)}`, bg: '#dcfce7' },
      { icon: '📊', label: 'Promedio/Servicio', value: `Bs. ${(f.length > 0 ? f.reduce((s, v) => s + v.monto, 0) / f.length : 0).toFixed(2)}`, bg: '#f3e8ff' },
      { icon: '⏱', label: 'Tiempo Total', value: `${f.reduce((s, v) => s + v.duracion, 0)} min`, bg: '#ffedd5' },
    ];
  }
}

// ==================== NOTIFICACIONES VIEW ====================
@Component({
  selector: 'app-notificaciones-view',
  standalone: true,
  imports: [CommonModule],
  template: `
<div style="flex:1;padding:1.5rem;overflow-y:auto">
  <div style="max-width:896px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div><h2>Notificaciones</h2><p class="text-sm text-gray-500">{{ noLeidas > 0 ? ('Tienes ' + noLeidas + ' sin leer') : 'Todas leídas' }}</p></div>
      <button *ngIf="noLeidas > 0" class="btn btn-outline" (click)="marcarTodas()">✓ Marcar todas como leídas</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <div *ngFor="let n of notifs()" class="card notif-card" [class.notif-unread]="!n.leida" (click)="marcar(n.id)">
        <div style="display:flex;gap:1rem">
          <div class="notif-icon" [style.background]="iconBg(n.tipo)">{{ iconEmoji(n.tipo) }}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.25rem">
              <p class="font-medium text-gray-900">{{ n.titulo }}</p>
              <div *ngIf="!n.leida" style="width:8px;height:8px;background:#2563eb;border-radius:50%;flex-shrink:0;margin-top:0.375rem"></div>
            </div>
            <p class="text-sm text-gray-600" style="margin-bottom:0.5rem">{{ n.mensaje }}</p>
            <div style="display:flex;align-items:center;gap:0.75rem">
              <span class="text-xs text-gray-500">{{ formatTime(n.timestamp) }}</span>
              <span class="badge badge-outline text-xs" [style.color]="iconColor(n.tipo)" [style.border-color]="iconColor(n.tipo)">{{ n.tipo }}</span>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="notifs().length === 0" style="text-align:center;padding:3rem;color:#6b7280">
        <div style="font-size:3rem;margin-bottom:1rem">🔔</div>
        <h3>No hay notificaciones</h3>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.notif-card { padding:1rem; cursor:pointer; transition:all 0.15s; }
.notif-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }
.notif-unread { background:#eff6ff; border-color:#bfdbfe; }
.notif-icon { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
  `]
})
export class NotificacionesViewComponent {
  state = inject(AppStateService);
  notifs = this.state.notificaciones;

  get noLeidas() { return this.notifs().filter(n => !n.leida).length; }

  marcar(id: string) { this.state.notificaciones.update(ns => ns.map(n => n.id === id ? { ...n, leida: true } : n)); }
  marcarTodas() { this.state.notificaciones.update(ns => ns.map(n => ({ ...n, leida: true }))); }

  iconEmoji(tipo: string) { return { solicitud: '🚗', repuesto: '📦', pago: '💰', mensaje: '💬' }[tipo] ?? '🔔'; }
  iconBg(tipo: string) { return { solicitud: '#dbeafe', repuesto: '#dcfce7', pago: '#f3e8ff', mensaje: '#ffedd5' }[tipo] ?? '#f3f4f6'; }
  iconColor(tipo: string) { return { solicitud: '#2563eb', repuesto: '#16a34a', pago: '#9333ea', mensaje: '#ea580c' }[tipo] ?? '#6b7280'; }

  formatTime(d: Date) {
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 1) return 'Ahora mismo';
    if (diff < 60) return `Hace ${Math.floor(diff)} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`;
    return `Hace ${Math.floor(diff / 1440)} d`;
  }
}

// ==================== PERSONAL VIEW ====================
@Component({
  selector: 'app-personal-view',
  standalone: true,
  imports: [CommonModule],
  template: `
<div style="flex:1;padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;overflow-y:auto">
  <div class="stats4">
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Total Personal</p><p class="stat-val">{{ mockData.personal.length }}</p></div>
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Disponibles</p><p class="stat-val">{{ disponibles }}</p></div>
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Asistencias Hoy</p><p class="stat-val">{{ asistenciasDia }}</p></div>
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Asistencias Mes</p><p class="stat-val">{{ asistenciasMes }}</p></div>
  </div>

  <div class="tabs-list">
    <button class="tabs-trigger" [class.active]="tab() === 'operativo'" (click)="tab.set('operativo')">Personal Operativo</button>
    <button class="tabs-trigger" [class.active]="tab() === 'administrativo'" (click)="tab.set('administrativo')">Personal Administrativo</button>
  </div>

  <div class="personal-grid">
    <div *ngFor="let p of tabPersonal" class="card pers-card" (click)="selected.set(p)">
      <div style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:1rem">
        <img [src]="p.foto" [alt]="p.nombre" style="width:64px;height:64px;border-radius:50%;object-fit:cover" />
        <div style="flex:1"><h3 style="margin-bottom:0.25rem">{{ p.nombre }}</h3><span class="badge badge-outline">{{ rolLabel(p.rol) }}</span></div>
      </div>
      <div *ngIf="p.estado" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
        <div class="pulse-dot" [style.background]="estadoColor(p.estado)"></div>
        <span class="text-sm text-gray-700">{{ estadoLabel(p.estado) }}</span>
      </div>
      <div *ngIf="p.estado" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;padding-top:0.75rem;border-top:1px solid #e5e7eb;margin-bottom:0.75rem">
        <div><p class="text-xs text-gray-500" style="margin-bottom:0.25rem">📅 Hoy</p><p class="text-sm text-gray-900">{{ p.asistenciasDia }}</p></div>
        <div><p class="text-xs text-gray-500" style="margin-bottom:0.25rem">📈 Mes</p><p class="text-sm text-gray-900">{{ p.asistenciasMes }}</p></div>
      </div>
      <button class="btn btn-outline btn-sm" style="width:100%">📞 {{ p.telefono }}</button>
    </div>
  </div>
</div>

<!-- Modal -->
<div *ngIf="selected()" class="modal-overlay" (click)="selected.set(null)">
  <div class="card" style="width:100%;max-width:448px;padding:1.5rem" (click)="$event.stopPropagation()">
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
      <img [src]="selected()!.foto" style="width:64px;height:64px;border-radius:50%;object-fit:cover" />
      <div><h3>{{ selected()!.nombre }}</h3><p class="text-sm text-gray-500">{{ rolLabel(selected()!.rol) }}</p></div>
    </div>
    <div *ngIf="selected()!.estado" style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;background:#f9fafb;border-radius:0.5rem">
        <span class="text-sm text-gray-600">Estado actual</span>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <div class="pulse-dot" [style.background]="estadoColor(selected()!.estado!)"></div>
          <span class="text-sm">{{ estadoLabel(selected()!.estado!) }}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
        <div style="padding:0.75rem;background:#f9fafb;border-radius:0.5rem"><p class="text-xs text-gray-500">Hoy</p><p>{{ selected()!.asistenciasDia }}</p></div>
        <div style="padding:0.75rem;background:#f9fafb;border-radius:0.5rem"><p class="text-xs text-gray-500">Mes</p><p>{{ selected()!.asistenciasMes }}</p></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <button class="btn btn-primary" style="width:100%" [disabled]="selected()!.estado === 'ocupado' || selected()!.estado === 'en_camino'">👤 Asignar a solicitud</button>
      <button class="btn btn-outline" style="width:100%" (click)="selected.set(null)">Cerrar</button>
    </div>
  </div>
</div>`,
  styles: [`
.stats4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
.stat-val { font-size:1.5rem; font-weight:600; color:#111827; margin-top:0.25rem; }
.personal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.pers-card { padding:1rem; cursor:pointer; transition:box-shadow 0.15s; }
.pers-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); }
.pulse-dot { width:12px; height:12px; border-radius:50%; animation:pulse 2s infinite; flex-shrink:0; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:2000; padding:1.5rem; }
  `]
})
export class PersonalViewComponent {
  mockData = inject(MockDataService);
  tab = signal('operativo');
  selected = signal<Personal | null>(null);

  get tabPersonal() { return this.tab() === 'operativo' ? this.mockData.personal.filter(p => p.estado) : this.mockData.personal.filter(p => !p.estado); }
  get disponibles() { return this.mockData.personal.filter(p => p.estado === 'disponible').length; }
  get asistenciasDia() { return this.mockData.personal.filter(p => p.estado).reduce((s, p) => s + p.asistenciasDia, 0); }
  get asistenciasMes() { return this.mockData.personal.filter(p => p.estado).reduce((s, p) => s + p.asistenciasMes, 0); }

  rolLabel(rol: string) { return ({ mecanico: 'Mecánico', electrico: 'Eléctrico', grua: 'Grúa', administrador: 'Administrador', encargado: 'Encargado' } as any)[rol] ?? rol; }
  estadoColor(e: string) { return ({ disponible: '#22c55e', ocupado: '#ef4444', en_camino: '#eab308', regresando: '#06b6d4' } as any)[e] ?? '#9ca3af'; }
  estadoLabel(e: string) { return ({ disponible: 'Disponible', ocupado: 'Ocupado', en_camino: 'En camino', regresando: 'Regresando al taller' } as any)[e] ?? e; }
}

// ==================== PERFIL TALLER VIEW ====================
@Component({
  selector: 'app-perfil-taller-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="flex:1;padding:1.5rem;overflow-y:auto">
  <div style="max-width:896px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">

    <!-- Header -->
    <div class="card" style="padding:1.5rem">
      <div style="display:flex;align-items:flex-start;gap:1.5rem">
        <div style="position:relative;flex-shrink:0">
          <img [src]="taller.foto" [alt]="taller.nombre" style="width:128px;height:128px;border-radius:0.75rem;object-fit:cover" />
          <button *ngIf="editing" style="position:absolute;bottom:0;right:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2563eb,#22c55e);color:white;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2)">📷</button>
        </div>
        <div style="flex:1">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
            <div>
              <h1 style="margin-bottom:0.5rem">{{ taller.nombre }}</h1>
              <div style="display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:#4b5563">
                <span>⭐ {{ taller.calificacion }}</span>
                <span>🔧 {{ taller.totalServicios }} servicios</span>
              </div>
            </div>
            <button *ngIf="!editing" class="btn btn-outline" (click)="editing = true">✏ Editar Perfil</button>
          </div>
          <p class="text-gray-600">{{ taller.descripcion }}</p>
        </div>
      </div>
    </div>

    <!-- Contacto -->
    <div class="card" style="padding:1.5rem">
      <h3 style="margin-bottom:1rem">Información de Contacto</h3>
      <ng-container *ngIf="!editing">
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <div *ngFor="let c of contactoItems" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:#f9fafb;border-radius:0.5rem">
            <span style="font-size:1.25rem">{{ c.icon }}</span>
            <div><p class="text-xs text-gray-500" style="margin-bottom:0.25rem">{{ c.label }}</p><p class="text-sm text-gray-900">{{ c.value }}</p></div>
          </div>
        </div>
      </ng-container>
      <ng-container *ngIf="editing">
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div><label class="label">Nombre del Taller</label><input class="input" [(ngModel)]="taller.nombre" style="margin-top:0.25rem" /></div>
          <div><label class="label">Ubicación</label><input class="input" [(ngModel)]="taller.ubicacion" style="margin-top:0.25rem" /></div>
          <div><label class="label">Teléfono</label><input class="input" [(ngModel)]="taller.telefono" style="margin-top:0.25rem" /></div>
          <div><label class="label">Email</label><input type="email" class="input" [(ngModel)]="taller.email" style="margin-top:0.25rem" /></div>
          <div><label class="label">Descripción</label><textarea class="input" [(ngModel)]="taller.descripcion" rows="3" style="margin-top:0.25rem"></textarea></div>
          <div style="display:flex;gap:0.75rem;padding-top:1rem">
            <button class="btn btn-primary" style="flex:1" (click)="editing = false">Guardar Cambios</button>
            <button class="btn btn-outline" style="flex:1" (click)="editing = false">Cancelar</button>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- Estadísticas -->
    <div class="card" style="padding:1.5rem">
      <h3 style="margin-bottom:1rem">Estadísticas</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
        <div *ngFor="let s of estadisticas" style="text-align:center;padding:1rem;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border-radius:0.5rem">
          <p style="font-size:1.875rem;font-weight:600;color:#111827;margin-bottom:0.25rem">{{ s.value }}</p>
          <p class="text-sm text-gray-600">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Configuración -->
    <div class="card" style="padding:1.5rem">
      <h3 style="margin-bottom:1rem">Configuración de Cuenta</h3>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <button class="btn btn-outline" style="justify-content:flex-start">✏ Cambiar Contraseña</button>
        <button class="btn btn-outline" style="justify-content:flex-start">🔔 Configurar Notificaciones</button>
        <hr class="separator" />
        <button class="btn btn-outline" style="justify-content:flex-start;color:#dc2626" (click)="state.logout()">🚪 Cerrar Sesión</button>
      </div>
    </div>
  </div>
</div>`,
  styles: [``]
})
export class PerfilTallerViewComponent {
  state = inject(AppStateService);
  mockData = inject(MockDataService);
  editing = false;
  taller = { ...this.mockData.taller };

  get contactoItems() {
    return [
      { icon: '📍', label: 'Ubicación', value: this.taller.ubicacion },
      { icon: '📞', label: 'Teléfono', value: this.taller.telefono },
      { icon: '✉', label: 'Email', value: this.taller.email },
    ];
  }

  get estadisticas() {
    return [
      { value: this.taller.totalServicios, label: 'Servicios Totales' },
      { value: `⭐ ${this.taller.calificacion}`, label: 'Calificación Promedio' },
      { value: '98%', label: 'Satisfacción' },
    ];
  }
}
