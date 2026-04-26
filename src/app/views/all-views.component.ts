import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { MockDataService, SANTA_CRUZ_CENTER } from '../services/mock-data.service';
import { ClientesService } from '../services/clientes.service';
import { ChatService } from '../services/chat.service';
import { RepuestosService } from '../services/repuestos.service';
import { Solicitud, Personal, Cliente, Servicio, Notificacion, MensajeChat, Repuesto, SolicitudRepuesto, Factura, MensajeChatCreate, Taller, EstadoSolicitud, MetodoPago, RolPersonal, EstadoPersonal } from '../models/types.model';
import { SolicitudesService } from '../services/solicitudes.service';
import { FacturasService } from '../services/facturas.service';
import { ServiciosService } from '../services/servicios.service';
import { PersonalService } from '../services/personal.service';
import { TallerService } from '../services/taller.service';
import { AuthService } from '../services/auth.service';
import { GruaService } from '../services/grua.service';
import { EvidenciasService } from '../services/evidencias.service';
import { ComprobantesService } from '../services/comprobantes.service';
import { PagosService } from '../services/pagos.service';

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
    <div *ngIf="loading()" style="padding:1rem;text-align:center">
      <span>Cargando...</span>
    </div>
    <div>
      <button *ngFor="let c of clientes()" (click)="seleccionarCliente(c)"
        class="chat-item" [class.active]="clienteSeleccionado()?.id === c.id">
        <img [src]="c.foto" [alt]="c.nombre" class="av48" />
        <div class="chat-item-info">
          <p class="font-medium text-gray-900 truncate">{{ c.nombre }}</p>
          <p class="text-sm text-gray-500 truncate">Última conversación</p>
        </div>
        <div *ngIf="clienteSeleccionado()?.id !== c.id" class="unread-dot"></div>
      </button>
    </div>
  </div>

  <!-- Chat -->
  <div class="chat-main card">
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <img [src]="clienteSeleccionado()?.foto" [alt]="clienteSeleccionado()?.nombre" class="av40" />
        <div>
          <p class="font-medium text-gray-900">{{ clienteSeleccionado()?.nombre }}</p>
          <p class="text-sm text-gray-500">{{ clienteSeleccionado()?.telefono }}</p>
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
export class ChatViewComponent implements OnInit {
  state = inject(AppStateService);
  mockData = inject(MockDataService);
  clientesService = inject(ClientesService);
  chatService = inject(ChatService);
  waveArr = new Array(20);

  clientes = signal<Cliente[]>([]);
  clienteSeleccionado = signal<Cliente | null>(null);
  nuevoMensaje = '';
  grabando = signal(false);
  reproduciendo = signal<string | null>(null);
  loading = signal(false);

  mensajes = signal<MensajeChat[]>([]);

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.loading.set(true);
    this.clientesService.listar()
      .subscribe({
        next: (data) => {
          this.clientes.set(data);
          if (data.length > 0 && !this.clienteSeleccionado()) {
            this.seleccionarCliente(data[0]);
          }
          this.loading.set(false);
        },
        error: () => {
          this.clientes.set(this.mockData.clientes);
          this.clienteSeleccionado.set(this.mockData.clientes[0]);
          this.loading.set(false);
        }
      });
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado.set(cliente);
    this.cargarMensajes(cliente.id);
  }

  cargarMensajes(clienteId: string) {
    this.chatService.obtenerMensajes(clienteId)
      .subscribe({
        next: (data) => this.mensajes.set(data),
        error: () => this.mensajes.set([
          { id: '1', emisor: 'cliente', contenido: 'Hola, ya estás en camino?', timestamp: new Date(Date.now() - 600000), tipo: 'texto' },
          { id: '2', emisor: 'taller', contenido: 'Sí, llegaré en aproximadamente 15 minutos', timestamp: new Date(Date.now() - 480000), tipo: 'texto' },
        ])
      });
  }

  getRandHeight() { return Math.random() * 16 + 8; }

  enviar(e?: any) {
    if (e instanceof KeyboardEvent) { if (!e.shiftKey) { e.preventDefault(); } else return; }
    if (!this.nuevoMensaje.trim() || this.grabando()) return;

    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    const mensaje: MensajeChatCreate = {
      emisor: 'taller',
      contenido: this.nuevoMensaje,
      tipo: 'texto'
    };

    this.chatService.enviarMensaje(cliente.id, mensaje)
      .subscribe({
        next: () => {
          this.cargarMensajes(cliente.id);
          this.nuevoMensaje = '';
        },
        error: () => {
          this.mensajes.update(m => [...m, { id: Date.now().toString(), emisor: 'taller', contenido: this.nuevoMensaje, timestamp: new Date(), tipo: 'texto' }]);
          this.nuevoMensaje = '';
        }
      });
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
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    const mensaje: MensajeChatCreate = {
      emisor: 'taller',
      contenido: '🤖 IA: Basándome en la descripción, te sugiero verificar:\n1. Rodamientos de ruedas\n2. Sistema de suspensión\n3. Balance de neumáticos',
      tipo: 'texto'
    };

    this.chatService.enviarMensaje(cliente.id, mensaje)
      .subscribe({
        next: () => this.cargarMensajes(cliente.id),
        error: () => this.mensajes.update(m => [...m, { id: Date.now().toString(), emisor: 'taller', contenido: mensaje.contenido, timestamp: new Date(), tipo: 'texto' }])
      });
  }
}

// ==================== SEGUIMIENTO VIEW ====================
@Component({
  selector: 'app-seguimiento-view',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="view-padded">
  <!-- SOLICITUD PENDIENTE (cuando viene del dashboard) -->
  <div *ngIf="state.solicitudPendienteSeleccionada() as pendiente" class="solicitud-pendiente-view">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <h2>🆕 Nueva Solicitud</h2>
        <p class="text-sm text-gray-500">Revisa los detalles y decide si aceptar o rechazar</p>
      </div>
      <button class="btn btn-outline" (click)="volverAlDashboard()">← Volver</button>
    </div>

    <!-- Layout de solicitud pendiente -->
    <div class="seg-layout">
      <!-- Mapa -->
      <div class="seg-map-section">
        <div class="card seg-map-card">
          <div id="seg-map-pendiente" class="leaflet-map"></div>
          <div class="distance-badge card" style="display:flex;align-items:center;gap:0.25rem"><svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {{ pendiente.distancia }} km de distancia</div>
        </div>
      </div>

      <!-- Panel info -->
      <div class="seg-panel">
        <!-- Cliente info -->
        <div class="card" style="padding:1rem">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
            <img [src]="pendiente.cliente.foto" class="av48" />
            <div>
              <p class="font-medium text-gray-900">{{ pendiente.cliente.nombre }}</p>
              <p class="text-sm text-gray-500">{{ pendiente.distancia }} km • {{ pendiente.cliente.telefono }}</p>
            </div>
          </div>
          <a
            class="btn btn-outline"
            style="width:100%;display:flex;align-items:center;justify-content:center;gap:0.5rem"
            [href]="'https://wa.me/' + pendiente.cliente.telefono"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> WhatsApp cliente
          </a>
        </div>

        <!-- Vehículo -->
        <div class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem;display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg> Vehículo</h3>
          <p class="font-medium text-gray-900">{{ pendiente.vehiculo.marca }} {{ pendiente.vehiculo.modelo }} {{ pendiente.vehiculo.anio }}</p>
          <span class="badge badge-outline" style="margin-top:0.5rem">{{ pendiente.vehiculo.placa }}</span>
        </div>

        <!-- Problema detectado por IA -->
        <div *ngIf="pendiente.analisisIA" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.75rem;display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px;color:#2563eb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Problema detectado por IA</h3>

          <!-- Tipo y prioridad -->
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
            <span *ngIf="pendiente.analisisIA?.tipoProblema" class="badge badge-primary">{{ pendiente.analisisIA?.tipoProblema }}</span>
            <span *ngIf="pendiente.analisisIA?.prioridad" class="badge" [class.badge-red]="pendiente.analisisIA?.prioridad === 'alta' || pendiente.analisisIA?.prioridad === 'critica'" [class.badge-amber]="pendiente.analisisIA?.prioridad === 'media'" [class.badge-green]="pendiente.analisisIA?.prioridad === 'baja'">
              {{ pendiente.analisisIA?.prioridad | titlecase }}
            </span>
            <span *ngIf="pendiente.analisisIA?.confianza" class="badge badge-primary">{{ pendiente.analisisIA?.confianza }}% confianza</span>
          </div>

          <!-- Transcripción -->
          <div *ngIf="pendiente.analisisIA?.transcripcionAudio" style="margin-bottom:0.75rem;padding:0.75rem;background:#f3f4f6;border-radius:0.5rem;border-left:3px solid #2563eb">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Transcripción del cliente</p>
            <p class="text-sm text-gray-700 italic">"{{ pendiente.analisisIA?.transcripcionAudio }}"</p>
          </div>

          <!-- Resumen -->
          <div *ngIf="pendiente.analisisIA?.resumen" style="margin-bottom:0.75rem">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Resumen del diagnóstico</p>
            <p class="text-sm text-gray-700">{{ pendiente.analisisIA?.resumen }}</p>
          </div>

          <!-- Daños -->
          <div *ngIf="pendiente.analisisIA?.danosDetectados?.length" style="margin-bottom:0.75rem">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Daños detectados</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem">
              <span *ngFor="let d of pendiente.analisisIA?.danosDetectados" class="badge badge-red">{{ d }}</span>
            </div>
          </div>

          <!-- Piezas -->
          <div *ngIf="pendiente.analisisIA?.piezasSugeridas?.length" style="margin-bottom:0.75rem">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Piezas sugeridas</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem">
              <span *ngFor="let p of pendiente.analisisIA?.piezasSugeridas" class="badge badge-secondary">{{ p }}</span>
            </div>
          </div>

          <!-- Estimaciones -->
          <div *ngIf="pendiente.analisisIA?.costoEstimado || pendiente.analisisIA?.tiempoEstimadoMinutos" style="display:flex;gap:1rem;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid #e5e7eb">
            <div *ngIf="pendiente.analisisIA?.costoEstimado">
              <p class="text-xs text-gray-500">Costo estimado</p>
              <p class="text-lg font-semibold text-gray-900">Bs. {{ pendiente.analisisIA?.costoEstimado | number }}</p>
            </div>
            <div *ngIf="pendiente.analisisIA?.tiempoEstimadoMinutos">
              <p class="text-xs text-gray-500">Tiempo estimado</p>
              <p class="text-lg font-semibold text-gray-900">{{ pendiente.analisisIA?.tiempoEstimadoMinutos }} min</p>
            </div>
          </div>

          <span *ngIf="pendiente.requiereRepuestos" class="badge badge-secondary" style="margin-top:0.75rem">Requiere repuestos</span>
          <span *ngIf="pendiente.tipo === 'grua'" class="badge badge-red" style="margin-top:0.5rem;display:flex;align-items:center;gap:0.25rem"><svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 11v6h1M3 16h.01"/></svg> Servicio de Grúa</span>
        </div>

        <!-- Problema sin IA -->
        <div *ngIf="!pendiente.analisisIA" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem;display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px;color:#f59e0b" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Problema reportado</h3>
          <p class="text-gray-900">{{ pendiente.descripcion }}</p>
          <span *ngIf="pendiente.requiereRepuestos" class="badge badge-secondary" style="margin-top:0.5rem">Requiere repuestos</span>
          <span *ngIf="pendiente.tipo === 'grua'" class="badge badge-red" style="margin-top:0.5rem;display:flex;align-items:center;gap:0.25rem"><svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 11v6h1M3 16h.01"/></svg> Servicio de Grúa</span>
        </div>

        <!-- Imágenes -->
        <div *ngIf="pendiente.imagenes?.length" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem">📷 Imágenes del vehículo</h3>
          <div class="img-grid-sm">
            <img *ngFor="let img of pendiente.imagenes" [src]="img" alt="img" class="img-sm" />
          </div>
        </div>

        <!-- Audio -->
        <div *ngIf="pendiente.audio" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem">🎙️ Mensaje de voz</h3>
          <div class="audio-block">
            <button class="btn btn-outline btn-sm">▶ Reproducir</button>
            <span class="text-xs text-gray-500">0:45</span>
          </div>
        </div>

        <!-- Selección de Personal (se muestra al hacer clic en Aceptar) -->
        <div *ngIf="showAsignacionModal()" class="card" style="padding:1rem;background:#f8fafc;border:2px solid #2563eb">
          <h3 class="text-sm font-medium" style="margin-bottom:0.75rem;color:#1d4ed8">👥 Seleccionar Personal</h3>

          <!-- Error -->
          <div *ngIf="asignacionError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.5rem;border-radius:0.375rem;margin-bottom:0.75rem;font-size:0.875rem">
            {{ asignacionError() }}
          </div>

          <!-- Resumen de selección -->
          <div *ngIf="personalSeleccionadoIds().length > 0" style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.5rem;border-radius:0.375rem;margin-bottom:0.75rem">
            <p class="text-xs font-medium" style="color:#1d4ed8">Seleccionados: {{ personalSeleccionadoIds().length }}</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.25rem">
              <span *ngFor="let pid of personalSeleccionadoIds()" class="badge badge-blue" style="font-size:0.75rem">
                {{ getNombrePersonal(pid) }}
              </span>
            </div>
          </div>

          <!-- Lista de personal por rol -->
          <div style="margin-bottom:0.75rem;max-height:250px;overflow-y:auto">
            <!-- Gruistas -->
            <div *ngIf="personalDisponiblesPorRol['grua']?.length" style="margin-bottom:0.75rem">
              <p class="text-xs text-gray-400" style="margin-bottom:0.25rem">🚛 GRÚA</p>
              <div style="display:flex;flex-direction:column;gap:0.375rem">
                <div *ngFor="let p of personalDisponiblesPorRol['grua']"
                     (click)="togglePersonalSeleccion(p.id)"
                     style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border:1px solid;border-radius:0.375rem;cursor:pointer;font-size:0.875rem"
                     [style.border-color]="isPersonalSeleccionado(p.id) ? '#2563eb' : '#e5e7eb'"
                     [style.background]="isPersonalSeleccionado(p.id) ? '#eff6ff' : 'white'">
                  <input type="checkbox" [checked]="isPersonalSeleccionado(p.id)" style="pointer-events:none;width:14px;height:14px"/>
                  <img [src]="p.foto || 'https://i.pravatar.cc/150?img=1'" [alt]="p.nombre" style="width:28px;height:28px;border-radius:50%;object-fit:cover"/>
                  <div style="flex:1">
                    <p class="font-medium" style="font-size:0.8rem">{{ p.nombre }}</p>
                    <p class="text-xs text-gray-500">{{ p.telefono }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mecánicos -->
            <div *ngIf="personalDisponiblesPorRol['mecanico']?.length" style="margin-bottom:0.75rem">
              <p class="text-xs text-gray-400" style="margin-bottom:0.25rem">🔧 MECÁNICOS</p>
              <div style="display:flex;flex-direction:column;gap:0.375rem">
                <div *ngFor="let p of personalDisponiblesPorRol['mecanico']"
                     (click)="togglePersonalSeleccion(p.id)"
                     style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border:1px solid;border-radius:0.375rem;cursor:pointer;font-size:0.875rem"
                     [style.border-color]="isPersonalSeleccionado(p.id) ? '#2563eb' : '#e5e7eb'"
                     [style.background]="isPersonalSeleccionado(p.id) ? '#eff6ff' : 'white'">
                  <input type="checkbox" [checked]="isPersonalSeleccionado(p.id)" style="pointer-events:none;width:14px;height:14px"/>
                  <img [src]="p.foto || 'https://i.pravatar.cc/150?img=1'" [alt]="p.nombre" style="width:28px;height:28px;border-radius:50%;object-fit:cover"/>
                  <div style="flex:1">
                    <p class="font-medium" style="font-size:0.8rem">{{ p.nombre }}</p>
                    <p class="text-xs text-gray-500">{{ p.telefono }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Eléctricos -->
            <div *ngIf="personalDisponiblesPorRol['electrico']?.length" style="margin-bottom:0.75rem">
              <p class="text-xs text-gray-400" style="margin-bottom:0.25rem">⚡ ELÉCTRICOS</p>
              <div style="display:flex;flex-direction:column;gap:0.375rem">
                <div *ngFor="let p of personalDisponiblesPorRol['electrico']"
                     (click)="togglePersonalSeleccion(p.id)"
                     style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border:1px solid;border-radius:0.375rem;cursor:pointer;font-size:0.875rem"
                     [style.border-color]="isPersonalSeleccionado(p.id) ? '#2563eb' : '#e5e7eb'"
                     [style.background]="isPersonalSeleccionado(p.id) ? '#eff6ff' : 'white'">
                  <input type="checkbox" [checked]="isPersonalSeleccionado(p.id)" style="pointer-events:none;width:14px;height:14px"/>
                  <img [src]="p.foto || 'https://i.pravatar.cc/150?img=1'" [alt]="p.nombre" style="width:28px;height:28px;border-radius:50%;object-fit:cover"/>
                  <div style="flex:1">
                    <p class="font-medium" style="font-size:0.8rem">{{ p.nombre }}</p>
                    <p class="text-xs text-gray-500">{{ p.telefono }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sin personal disponible -->
            <div *ngIf="personalDisponibles().length === 0" style="text-align:center;padding:0.75rem;color:#6b7280">
              <p style="font-size:0.875rem">No hay personal disponible</p>
            </div>
          </div>

          <!-- Botones de acción -->
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-outline" style="flex:1;font-size:0.875rem" (click)="cerrarModalAsignacion()">
              Cancelar
            </button>
            <button class="btn btn-primary" style="flex:1;font-size:0.875rem" (click)="confirmarAsignacion()" [disabled]="asignandoPersonal() || personalSeleccionadoIds().length === 0">
              <span *ngIf="!asignandoPersonal()">✓ Confirmar</span>
              <span *ngIf="asignandoPersonal()">⏳ Asignando...</span>
            </button>
          </div>
        </div>

        <!-- Acciones (solo se muestra cuando NO está abierta la selección) -->
        <div *ngIf="!showAsignacionModal()" class="card" style="padding:1rem;background:linear-gradient(135deg,#eff6ff,#f0fdf4)">
          <h3 class="text-sm font-medium" style="margin-bottom:0.75rem">¿Deseas aceptar esta solicitud?</h3>
          <div style="display:flex;gap:0.75rem">
            <button class="btn btn-outline" style="flex:1" (click)="rechazarSolicitudPendiente()">
              ✕ Rechazar
            </button>
            <button class="btn btn-primary" style="flex:1" (click)="aceptarSolicitudPendiente()">
              ✓ Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- VISTA NORMAL DE SEGUIMIENTO (sin solicitud pendiente) -->
  <div *ngIf="!state.solicitudPendienteSeleccionada()">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <h2 style="display:flex;align-items:center;gap:0.5rem"><svg style="width:24px;height:24px;color:#2563eb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Seguimiento de Servicios</h2>
        <p class="text-sm text-gray-500">Gestiona todas las solicitudes activas</p>
      </div>
      <button class="btn btn-primary" (click)="cargarSolicitudesActivas()" style="display:flex;align-items:center;gap:0.5rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Actualizar</button>
    </div>

    <!-- Loading -->
  <div *ngIf="loading()" style="text-align:center;padding:3rem">
    <div class="spinner"></div>
    <p class="text-gray-500">Cargando solicitudes...</p>
  </div>

  <!-- Sin solicitudes -->
  <div *ngIf="!loading() && solicitudesActivas().length === 0" class="empty-state">
    <div class="empty-icon"><svg style="width:64px;height:64px;color:#d1d5db" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1z"/><path d="M5 17H3c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1z"/><path d="M16 3H8C6 3 5 4 5 6v12c0 2 1 3 3 3h8c2 0 3-1 3-3V6c0-2-1-3-3-3z"/><path d="M5 9h14"/></svg></div>
    <h3>No hay servicios activos</h3>
    <p class="text-sm text-gray-500">Acepta solicitudes desde el Dashboard</p>
    <button class="btn btn-primary" style="margin-top:1rem" (click)="state.navigateTo('dashboard')">
      Ir al Dashboard
    </button>
  </div>

  <!-- Lista de solicitudes activas -->
  <div *ngIf="!loading() && solicitudesActivas().length > 0">
    
    <!-- Selector de solicitudes -->
    <div class="card" style="padding:1rem;margin-bottom:1.5rem">
      <h3 class="text-sm text-gray-500" style="margin-bottom:0.75rem">
        Servicios Activos ({{ solicitudesActivas().length }})
      </h3>
      <div class="solicitudes-list">
        <div 
          *ngFor="let s of solicitudesActivas()" 
          class="solicitud-item"
          [class.selected]="solicitudSeleccionada()?.id === s.id"
          (click)="seleccionarSolicitud(s)"
        >
          <img [src]="s.cliente.foto" class="av40" />
          <div style="flex:1">
            <p class="font-medium text-gray-900">{{ s.cliente.nombre }}</p>
            <p class="text-xs text-gray-500">{{ s.vehiculo.marca }} {{ s.vehiculo.modelo }} • {{ s.distancia }} km</p>
          </div>
          <span class="badge" [class.badge-green]="s.estado === 'en_reparacion'" [class.badge-blue]="s.estado === 'aceptada'" [class.badge-yellow]="s.estado === 'en_camino'">
            {{ s.estado }}
          </span>
        </div>
      </div>
    </div>

    <!-- Detalle de solicitud seleccionada -->
    <div *ngIf="solicitudSeleccionada()" class="seg-layout">
      <!-- Mapa -->
      <div class="seg-map-section">
        <div class="card seg-map-card">
          <div id="seg-map" class="leaflet-map"></div>
          <div *ngIf="hasLlegado" class="llegada-msg card" style="display:flex;align-items:center;gap:0.25rem"><svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Mecánico en ubicación</div>
        </div>
      </div>

      <!-- Panel info -->
      <div class="seg-panel">
        <!-- Cliente info -->
        <div class="card" style="padding:1rem">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
            <div style="display:flex;align-items:center;gap:0.75rem">
              <img [src]="solicitudSeleccionada()!.cliente.foto" class="av48" />
              <div>
                <p class="font-medium text-gray-900">{{ solicitudSeleccionada()!.cliente.nombre }}</p>
                <p class="text-sm text-gray-500">{{ solicitudSeleccionada()!.distancia }} km</p>
                <p class="text-xs text-gray-400" style="font-family:monospace">ID: {{ solicitudSeleccionada()!.id.substring(0,8) }}...</p>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" (click)="state.navigateTo('chat')" style="display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
          </div>
          <div class="text-sm" style="display:flex;flex-direction:column;gap:0.5rem">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg> <span>{{ solicitudSeleccionada()!.vehiculo.marca }} {{ solicitudSeleccionada()!.vehiculo.modelo }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;color:#6b7280">
              <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> <span>{{ solicitudSeleccionada()!.cliente.lat.toFixed(4) }}, {{ solicitudSeleccionada()!.cliente.lng.toFixed(4) }}</span>
            </div>
          </div>
          <button class="btn btn-outline" style="width:100%;margin-top:1rem;display:flex;align-items:center;justify-content:center;gap:0.5rem">
            <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> {{ solicitudSeleccionada()!.cliente.telefono }}
          </button>
        </div>

        <!-- Estados -->
        <div class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:1rem;display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg> Control de Estados</h3>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <button *ngFor="let est of estados; let i = index"
              (click)="cambiarEstado(est.id, i)"
              [disabled]="!isAvailable(i) || loading()"
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

        <!-- Personal Asignado -->
        <div *ngIf="solicitudSeleccionada()!.personalAsignado?.length" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.75rem">👥 Personal Asignado</h3>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <div *ngFor="let p of solicitudSeleccionada()!.personalAsignado" style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;background:#f9fafb;border-radius:0.5rem">
              <img [src]="p.foto || 'https://i.pravatar.cc/150?img=1'" [alt]="p.nombre" style="width:40px;height:40px;border-radius:50%;object-fit:cover"/>
              <div style="flex:1">
                <p class="font-medium text-sm">{{ p.nombre }}</p>
                <p class="text-xs text-gray-500">{{ p.rol === 'grua' ? '🚛 Gruista' : p.rol === 'mecanico' ? '🔧 Mecánico' : '⚡ Eléctrico' }} • {{ p.telefono }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Problema detectado por IA -->
        <div *ngIf="solicitudSeleccionada()!.analisisIA" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.75rem">Problema detectado por IA</h3>

          <!-- Tipo y prioridad -->
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap">
            <span *ngIf="solicitudSeleccionada()!.analisisIA?.tipoProblema" class="badge badge-primary">{{ solicitudSeleccionada()!.analisisIA?.tipoProblema }}</span>
            <span *ngIf="solicitudSeleccionada()!.analisisIA?.prioridad" class="badge" [class.badge-red]="solicitudSeleccionada()!.analisisIA?.prioridad === 'alta' || solicitudSeleccionada()!.analisisIA?.prioridad === 'critica'" [class.badge-amber]="solicitudSeleccionada()!.analisisIA?.prioridad === 'media'" [class.badge-green]="solicitudSeleccionada()!.analisisIA?.prioridad === 'baja'">
              {{ solicitudSeleccionada()!.analisisIA?.prioridad | titlecase }}
            </span>
            <span *ngIf="solicitudSeleccionada()!.analisisIA?.confianza" class="badge badge-primary">{{ solicitudSeleccionada()!.analisisIA?.confianza }}% confianza</span>
          </div>

          <!-- Transcripción -->
          <div *ngIf="solicitudSeleccionada()!.analisisIA?.transcripcionAudio" style="margin-bottom:0.75rem;padding:0.75rem;background:#f3f4f6;border-radius:0.5rem;border-left:3px solid #2563eb">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Transcripción del cliente</p>
            <p class="text-sm text-gray-700 italic">"{{ solicitudSeleccionada()!.analisisIA?.transcripcionAudio }}"</p>
          </div>

          <!-- Resumen -->
          <div *ngIf="solicitudSeleccionada()!.analisisIA?.resumen" style="margin-bottom:0.75rem">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Resumen del diagnóstico</p>
            <p class="text-sm text-gray-700">{{ solicitudSeleccionada()!.analisisIA?.resumen }}</p>
          </div>

          <!-- Daños -->
          <div *ngIf="solicitudSeleccionada()!.analisisIA?.danosDetectados?.length" style="margin-bottom:0.75rem">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Daños detectados</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem">
              <span *ngFor="let d of solicitudSeleccionada()!.analisisIA?.danosDetectados" class="badge badge-red">{{ d }}</span>
            </div>
          </div>

          <!-- Piezas -->
          <div *ngIf="solicitudSeleccionada()!.analisisIA?.piezasSugeridas?.length" style="margin-bottom:0.75rem">
            <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">Piezas sugeridas</p>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem">
              <span *ngFor="let p of solicitudSeleccionada()!.analisisIA?.piezasSugeridas" class="badge badge-secondary">{{ p }}</span>
            </div>
          </div>

          <!-- Estimaciones -->
          <div *ngIf="solicitudSeleccionada()!.analisisIA?.costoEstimado || solicitudSeleccionada()!.analisisIA?.tiempoEstimadoMinutos" style="display:flex;gap:1rem;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid #e5e7eb">
            <div *ngIf="solicitudSeleccionada()!.analisisIA?.costoEstimado">
              <p class="text-xs text-gray-500">Costo estimado</p>
              <p class="text-lg font-semibold text-gray-900">Bs. {{ solicitudSeleccionada()!.analisisIA?.costoEstimado | number }}</p>
            </div>
            <div *ngIf="solicitudSeleccionada()!.analisisIA?.tiempoEstimadoMinutos">
              <p class="text-xs text-gray-500">Tiempo estimado</p>
              <p class="text-lg font-semibold text-gray-900">{{ solicitudSeleccionada()!.analisisIA?.tiempoEstimadoMinutos }} min</p>
            </div>
          </div>

          <span *ngIf="solicitudSeleccionada()!.requiereRepuestos" class="badge badge-secondary" style="margin-top:0.75rem">Requiere repuestos</span>
        </div>

        <!-- Problema sin IA -->
        <div *ngIf="!solicitudSeleccionada()!.analisisIA" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem">Problema reportado</h3>
          <p class="text-gray-900">{{ solicitudSeleccionada()!.descripcion }}</p>
          <span *ngIf="solicitudSeleccionada()!.requiereRepuestos" class="badge badge-secondary" style="margin-top:0.5rem">Requiere repuestos</span>
        </div>

        <!-- Imágenes -->
        <div *ngIf="solicitudSeleccionada()!.imagenes?.length" class="card" style="padding:1rem">
          <h3 class="text-sm text-gray-500" style="margin-bottom:0.5rem">Imágenes del vehículo</h3>
          <div class="img-grid-sm">
            <img *ngFor="let img of solicitudSeleccionada()!.imagenes" [src]="img" alt="img" class="img-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</div>`,
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
.av40 { width:40px; height:40px; border-radius:50%; object-fit:cover; }
.view-padded { flex:1; padding:1.5rem; display:flex; flex-direction:column; overflow-y:auto; }
.spinner { width:40px; height:40px; border:3px solid #e5e7eb; border-top-color:#2563eb; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 1rem; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Lista de solicitudes en seguimiento */
.solicitudes-list { display:flex; flex-direction:column; gap:0.5rem; }
.solicitud-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem; border-radius:0.5rem; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
.solicitud-item:hover { background:#f9fafb; }
.solicitud-item.selected { background:#eff6ff; border-color:#2563eb; }
.badge-blue { background:#dbeafe; color:#1e40af; }
.badge-yellow { background:#fef3c7; color:#92400e; }
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

/* Vista de solicitud pendiente */
.solicitud-pendiente-view { animation:fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.distance-badge { position:absolute; top:1rem; right:1rem; background:white; padding:0.5rem 1rem; border-radius:0.5rem; box-shadow:0 2px 8px rgba(0,0,0,0.1); z-index:400; }
.audio-block { display:flex; align-items:center; gap:0.75rem; padding:0.75rem; background:#f9fafb; border-radius:0.5rem; }
.badge-red { background:#fecaca; color:#991b1b; }
  `]
})
export class SeguimientoViewComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  solicitudesService = inject(SolicitudesService);
  evidenciasService = inject(EvidenciasService);
  personalService = inject(PersonalService);
  estadoActual = signal('en_camino');
  loading = signal(false);
  error = signal<string | null>(null);
  private map: any = null;
  
  // Lista de solicitudes activas
  solicitudesActivas = signal<Solicitud[]>([]);
  solicitudSeleccionada = signal<Solicitud | null>(null);
  
  // Evidencias
  evidencias = signal<any[]>([]);
  loadingEvidencias = signal(false);
  mostrarGaleria = signal(false);
  evidenciaSeleccionada = signal<any | null>(null);

  // Solicitud pendiente
  aceptando = signal(false);

  // ============ MODAL ASIGNACIÓN DE PERSONAL ============
  showAsignacionModal = signal(false);
  personalSeleccionadoIds = signal<string[]>([]);
  asignandoPersonal = signal(false);
  asignacionError = signal<string | null>(null);
  personalDisponibles = signal<Personal[]>([]);

  estados = [
    { id: 'aceptada', label: 'Aceptada', icon: 'check' },
    { id: 'en_camino', label: 'En camino', icon: 'car' },
    { id: 'reparando', label: 'Reparando', icon: 'wrench' },
    { id: 'finalizada', label: 'Finalizada', icon: 'check-circle' },
  ];

  get hasLlegado() { return this.estadoActual() === 'reparando' || this.estadoActual() === 'finalizada'; }

  currentIndex() { return this.estados.findIndex(e => e.id === this.estadoActual()); }
  isDone(i: number) { return this.currentIndex() > i; }
  isAvailable(i: number) { return this.currentIndex() >= i - 1; }

  ngOnInit() {
    this.cargarSolicitudesActivas();
    // Si hay una solicitud seleccionada o pendiente, inicializar mapa
    setTimeout(() => {
      if (this.state.solicitudPendienteSeleccionada()) {
        this.initMapPendiente();
      } else {
        this.initMap();
      }
    }, 200);
  }

  async cargarSolicitudesActivas() {
    this.loading.set(true);
    try {
      const data = await this.solicitudesService.listar({ activas: true }).toPromise();
      this.solicitudesActivas.set(data ?? []);
      
      // Si hay solicitudes y no hay ninguna seleccionada, seleccionar la primera
      if (data && data.length > 0 && !this.solicitudSeleccionada()) {
        this.seleccionarSolicitud(data[0]);
      }
    } catch (e) {
      this.error.set('Error al cargar solicitudes activas');
    } finally {
      this.loading.set(false);
    }
  }

  seleccionarSolicitud(s: Solicitud) {
    this.solicitudSeleccionada.set(s);
    this.estadoActual.set(s.estado);
    // Reinicializar mapa con nueva ubicación
    setTimeout(() => {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      this.initMap();
    }, 100);
  }

  ngOnDestroy() { if (this.map) { this.map.remove(); this.map = null; } }

  initMap() {
    if (typeof (window as any).L === 'undefined') return;
    const L = (window as any).L;
    const s = this.solicitudSeleccionada();
    if (!s) return;
    const container = document.getElementById('seg-map');
    if (!container) return;
    this.map = L.map('seg-map').setView([s.cliente.lat, s.cliente.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);
    const icon = (window as any).L.divIcon({ html: `<div style="width:32px;height:32px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`, className:'', iconSize:[32,32], iconAnchor:[16,16] });
    L.marker([s.cliente.lat, s.cliente.lng], { icon }).addTo(this.map).bindPopup(s.cliente.nombre);
  }

  initMapPendiente() {
    if (typeof (window as any).L === 'undefined') return;
    const L = (window as any).L;
    const s = this.state.solicitudPendienteSeleccionada();
    if (!s) return;
    const container = document.getElementById('seg-map-pendiente');
    if (!container) return;
    this.map = L.map('seg-map-pendiente').setView([s.cliente.lat, s.cliente.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);
    const icon = L.divIcon({ html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#2563eb,#22c55e);border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${s.cliente.nombre[0]}</div>`, className:'', iconSize:[36,36], iconAnchor:[18,18] });
    L.marker([s.cliente.lat, s.cliente.lng], { icon }).addTo(this.map).bindPopup(s.cliente.nombre);
  }

  volverAlDashboard() {
    this.state.limpiarSolicitudPendiente();
    this.state.navigateTo('dashboard');
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  aceptarSolicitudPendiente() {
    // Abrir modal de asignación
    const solicitud = this.state.solicitudPendienteSeleccionada();
    if (!solicitud) return;

    this.personalSeleccionadoIds.set([]);
    this.asignacionError.set(null);
    this.showAsignacionModal.set(true);
    this.cargarPersonalDisponible();
  }

  cargarPersonalDisponible() {
    this.personalService.listar({ disponibles: true })
      .subscribe({
        next: (data) => this.personalDisponibles.set(data),
        error: () => this.personalDisponibles.set([])
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
    const p = this.personalDisponibles().find(p => p.id === personalId);
    return p?.nombre || 'Desconocido';
  }

  get personalDisponiblesPorRol() {
    const porRol: Record<string, Personal[]> = {
      mecanico: [],
      electrico: [],
      grua: [],
      administrador: [],
      encargado: []
    };

    this.personalDisponibles().forEach(p => {
      if (p.rol in porRol) {
        porRol[p.rol].push(p);
      }
    });

    return porRol;
  }

  confirmarAsignacion() {
    const solicitud = this.state.solicitudPendienteSeleccionada();
    if (!solicitud) return;

    if (this.personalSeleccionadoIds().length === 0) {
      this.asignacionError.set('Debes seleccionar al menos un técnico');
      return;
    }

    this.asignandoPersonal.set(true);
    this.asignacionError.set(null);

    this.solicitudesService.asignarPersonal(solicitud.id, this.personalSeleccionadoIds())
      .subscribe({
        next: (solicitudActualizada) => {
          this.asignandoPersonal.set(false);
          this.showAsignacionModal.set(false);
          this.state.aceptarSolicitud(solicitudActualizada);
          this.state.limpiarSolicitudPendiente();
          this.cargarSolicitudesActivas();
        },
        error: (err) => {
          this.asignandoPersonal.set(false);
          this.asignacionError.set('Error al asignar: ' + err.message);
        }
      });
  }

  cerrarModalAsignacion() {
    this.showAsignacionModal.set(false);
    this.personalSeleccionadoIds.set([]);
    this.asignacionError.set(null);
  }

  rechazarSolicitudPendiente() {
    const solicitud = this.state.solicitudPendienteSeleccionada();
    if (!solicitud) return;

    this.solicitudesService.cambiarEstado(solicitud.id, 'rechazada')
      .subscribe({
        next: () => {
          this.state.limpiarSolicitudPendiente();
          this.state.navigateTo('dashboard');
          if (this.map) {
            this.map.remove();
            this.map = null;
          }
        },
        error: (err) => {
          this.error.set('Error al rechazar solicitud: ' + err.message);
        }
      });
  }

  cambiarEstado(id: string, i: number) {
    if (!this.isAvailable(i)) return;
    
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return;
    
    console.log('[TALLER] Cambiando estado de solicitud:', solicitud.id, 'a:', id);
    
    this.loading.set(true);
    this.solicitudesService.cambiarEstado(solicitud.id, id as EstadoSolicitud)
      .subscribe({
        next: () => {
          console.log('[TALLER] Estado cambiado exitosamente para:', solicitud.id);
          this.estadoActual.set(id);
          // Actualizar la solicitud seleccionada con nuevo estado
          this.solicitudSeleccionada.update(s => s ? { ...s, estado: id as any } : null);
          // Recargar lista
          this.cargarSolicitudesActivas();
          this.loading.set(false);
          if (id === 'finalizada') {
            // Opcional: mostrar mensaje de éxito
          }
        },
        error: (err) => {
          console.error('[TALLER] Error cambiando estado:', err);
          this.error.set('Error al cambiar estado: ' + err.message);
          this.loading.set(false);
        }
      });
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
  <!-- Header con busqueda -->
  <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem">
    <div>
      <h2 style="margin:0">Pagos y Facturas</h2>
      <p class="text-sm text-gray-500">Santa Cruz, Bolivia</p>
    </div>
    <div style="position:relative;flex:1;max-width:400px">
      <span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af">🔍</span>
      <input class="input" [(ngModel)]="busqueda" (ngModelChange)="filtrarFacturas()" placeholder="Buscar clientes, servicios..." style="padding-left:2.25rem;width:100%" />
    </div>
  </div>

  <!-- Stats -->
  <div class="stats3">
    <div *ngFor="let s of resumen" class="card" style="padding:1rem">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <div class="stat-icon" [style.background]="s.bg" style="display:flex;align-items:center;justify-content:center">
          <svg *ngIf="s.icon === 'qr'" style="width:20px;height:20px;color:#16a34a" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <svg *ngIf="s.icon === 'card'" style="width:20px;height:20px;color:#2563eb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          <svg *ngIf="s.icon === 'money'" style="width:20px;height:20px;color:white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div>
          <p class="text-sm text-gray-500">{{ s.label }}</p>
          <p class="font-medium text-gray-900">Bs. {{ s.monto.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" class="card" style="padding:2rem;text-align:center">
    <div class="spinner" style="margin:0 auto 1rem"></div>
    <p class="text-sm text-gray-500">Cargando datos...</p>
  </div>

  <!-- Error -->
  <div *ngIf="error() && !loading()" class="card" style="padding:1rem;background:#fef2f2;border-color:#fecaca;color:#dc2626">
    {{ error() }}
    <button class="btn btn-sm btn-outline" style="margin-left:1rem" (click)="cargarDatos()">Reintentar</button>
  </div>

  <!-- Tabs -->
  <div class="tabs-list" *ngIf="!loading()">
    <button class="tabs-trigger" [class.active]="tab() === 'confirmar'" (click)="tab.set('confirmar')">Confirmar Pago</button>
    <button class="tabs-trigger" [class.active]="tab() === 'facturas'" (click)="tab.set('facturas')">Facturas</button>
    <button class="tabs-trigger" [class.active]="tab() === 'reportes'" (click)="tab.set('reportes')">Reportes</button>
  </div>

  <!-- Confirmar -->
  <div *ngIf="tab() === 'confirmar' && !loading()">
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
        <div class="resumen-row"><span>Monto del servicio:</span><span>Bs. {{ (+monto).toFixed(2) }}</span></div>
        <div class="resumen-row"><span>Comisión (10%):</span><span>Bs. {{ (+monto * 0.1).toFixed(2) }}</span></div>
        <hr class="separator" /><div class="resumen-row font-medium"><span>Total a cobrar:</span><span>Bs. {{ (+monto * 1.1).toFixed(2) }}</span></div>
      </div>
      <button class="btn btn-primary" style="width:100%;display:flex;align-items:center;justify-content:center;gap:0.5rem" [disabled]="!monto || loading()" (click)="confirmarPago()">
        <svg *ngIf="!loading()" style="width:18px;height:18px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        {{ loading() ? 'Procesando...' : 'Confirmar Monto y Solicitar Pago' }}
      </button>
      @if (error()) {
        <div style="margin-top:0.5rem;padding:0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:0.5rem;color:#dc2626;font-size:0.875rem">
          {{ error() }}
        </div>
      }
    </div>
    <ng-template #noServicio>
      <div class="card empty-state-card">
        <div style="font-size:3rem;opacity:0.3;margin-bottom:1rem;display:flex;justify-content:center"><svg style="width:64px;height:64px;color:#d1d5db" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <h3>No hay servicio activo</h3>
        <p class="text-sm text-gray-500">Los pagos se confirman después de finalizar un servicio</p>
      </div>
    </ng-template>
  </div>

  <!-- Facturas -->
  <div *ngIf="tab() === 'facturas' && !loading()" class="card" style="padding:1.5rem">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem">
      <h3>Facturas Generadas</h3>
      <div style="display:flex;gap:0.5rem">
        <button class="btn btn-outline btn-sm" (click)="cargarDatos()">🔄 Actualizar</button>
      </div>
    </div>

    <!-- Filtros rápidos -->
    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
      <button class="btn btn-sm" [class.btn-primary]="filtroEstado() === 'todos'" [class.btn-outline]="filtroEstado() !== 'todos'" (click)="setFiltroEstado('todos')">Todos</button>
      <button class="btn btn-sm" [class.btn-primary]="filtroEstado() === 'enviadas'" [class.btn-outline]="filtroEstado() !== 'enviadas'" (click)="setFiltroEstado('enviadas')">Enviadas</button>
      <button class="btn btn-sm" [class.btn-primary]="filtroEstado() === 'pendientes'" [class.btn-outline]="filtroEstado() !== 'pendientes'" (click)="setFiltroEstado('pendientes')">Pendientes</button>
    </div>

    <!-- Lista facturas filtradas -->
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <div *ngIf="facturasFiltradas().length === 0" style="text-align:center;padding:2rem;color:#6b7280">
        <p>No se encontraron facturas</p>
      </div>
      <div *ngFor="let f of facturasFiltradas()" class="factura-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <img [src]="f.cliente?.foto || 'https://i.pravatar.cc/150?img=12'" class="av40" />
            <div>
              <p class="font-medium text-gray-900">{{ f.cliente?.nombre || 'Cliente' }}</p>
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
          <div><span class="text-gray-500 text-xs">Método:</span><p class="text-sm">{{ (f.metodoPago || 'Efectivo').toUpperCase() }}</p></div>
          <div><span class="text-gray-500 text-xs">Comisión (10%):</span><p class="text-sm">Bs. {{ f.comision?.toFixed(2) || (f.monto * 0.1).toFixed(2) }}</p></div>
          <div><span class="text-gray-500 text-xs">Total:</span><p class="text-sm font-medium">Bs. {{ f.total?.toFixed(2) || (f.monto * 1.1).toFixed(2) }}</p></div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button class="btn btn-outline btn-sm" style="flex:1" (click)="verFactura(f)">👁 Ver</button>
          <button *ngIf="!f.enviada" class="btn btn-primary btn-sm" style="flex:1" (click)="enviarFactura(f)" [disabled]="enviandoFactura() === f.id">
            <span *ngIf="enviandoFactura() !== f.id">📤 Enviar</span>
            <span *ngIf="enviandoFactura() === f.id">Enviando...</span>
          </button>
          <button class="btn btn-outline btn-sm" (click)="imprimirFactura(f)">🖨</button>
        </div>
      </div>
    </div>

    <!-- Modal Ver Factura -->
    <div *ngIf="facturaSeleccionada()" class="modal-overlay" (click)="cerrarModalFactura()">
      <div class="modal-card card" style="max-width:500px" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h3>Factura #{{ facturaSeleccionada()?.id?.slice(-8) }}</h3>
            <button class="btn btn-ghost btn-icon" (click)="cerrarModalFactura()">✕</button>
          </div>
          <div style="background:#f9fafb;padding:1rem;border-radius:0.5rem;margin-bottom:1rem">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <img [src]="facturaSeleccionada()?.cliente?.foto || 'https://i.pravatar.cc/150?img=12'" style="width:48px;height:48px;border-radius:50%" />
              <div>
                <p class="font-medium">{{ facturaSeleccionada()?.cliente?.nombre || 'Cliente' }}</p>
                <p class="text-sm text-gray-500">{{ facturaSeleccionada()?.cliente?.telefono }}</p>
              </div>
            </div>
            <hr class="separator" />
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span class="text-gray-500">Monto:</span>
              <span>Bs. {{ facturaSeleccionada()?.monto?.toFixed(2) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span class="text-gray-500">Comisión (10%):</span>
              <span>Bs. {{ facturaSeleccionada()?.comision?.toFixed(2) || ((facturaSeleccionada()?.monto || 0) * 0.1).toFixed(2) }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:500">
              <span>Total:</span>
              <span>Bs. {{ facturaSeleccionada()?.total?.toFixed(2) || ((facturaSeleccionada()?.monto || 0) * 1.1).toFixed(2) }}</span>
            </div>
            <hr class="separator" />
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span class="text-gray-500">Método de pago:</span>
              <span>{{ (facturaSeleccionada()?.metodoPago || 'Efectivo').toUpperCase() }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="text-gray-500">Estado:</span>
              <span [style.color]="facturaSeleccionada()?.enviada ? '#16a34a' : '#ca8a04'">{{ facturaSeleccionada()?.enviada ? 'Enviada' : 'Pendiente' }}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="text-gray-500">Fecha:</span>
              <span>{{ facturaSeleccionada()?.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-outline" style="flex:1" (click)="imprimirFactura(facturaSeleccionada()!)">🖨 Imprimir</button>
            <button *ngIf="!facturaSeleccionada()?.enviada" class="btn btn-primary" style="flex:1" (click)="enviarFactura(facturaSeleccionada()!); cerrarModalFactura()">📤 Enviar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reportes -->
  <div *ngIf="tab() === 'reportes' && !loading()" class="card" style="padding:1.5rem">
    <h3 style="margin-bottom:1rem">Exportar Reportes</h3>
    <div style="margin-bottom:1rem">
      <label class="label">Período</label>
      <select [(ngModel)]="periodoReporte" (change)="actualizarReporte()" class="select" style="margin-top:0.25rem">
        <option value="hoy">Hoy</option>
        <option value="semana">Esta Semana</option>
        <option value="mes">Este Mes</option>
      </select>
    </div>
    <hr class="separator" style="margin:1rem 0" />
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <button class="btn btn-outline" style="justify-content:flex-start;display:flex;align-items:center;gap:0.5rem" (click)="exportarPDF()" [disabled]="exportando()">
        <span>📄</span>
        <span>{{ exportando() === 'pdf' ? 'Generando PDF...' : 'Exportar como PDF' }}</span>
      </button>
      <button class="btn btn-outline" style="justify-content:flex-start;display:flex;align-items:center;gap:0.5rem" (click)="exportarExcel()" [disabled]="exportando()">
        <span>📊</span>
        <span>{{ exportando() === 'excel' ? 'Generando Excel...' : 'Exportar como Excel' }}</span>
      </button>
      <button class="btn btn-outline" style="justify-content:flex-start;display:flex;align-items:center;gap:0.5rem" (click)="exportarImprimible()" [disabled]="exportando()">
        <span>🖨</span>
        <span>{{ exportando() === 'print' ? 'Preparando...' : 'Formato Imprimible' }}</span>
      </button>
    </div>
    <div class="ia-panel" style="margin-top:1rem">
      <h4 class="text-sm font-medium" style="margin-bottom:0.5rem">Resumen del Período</h4>
      <div class="text-sm" style="display:flex;flex-direction:column;gap:0.25rem">
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Facturas:</span><span>{{ stats()?.total_facturas || facturas().length }}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Ingresos:</span><span>Bs. {{ ingresosTotal.toFixed(2) }}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Comisiones:</span><span>Bs. {{ (ingresosTotal * 0.1).toFixed(2) }}</span></div>
        <div style="display:flex;justify-content:space-between"><span class="text-gray-600">Neto:</span><span>Bs. {{ (ingresosTotal * 0.9).toFixed(2) }}</span></div>
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
.spinner { width:40px; height:40px; border:3px solid #e5e7eb; border-top-color:#3b82f6; border-radius:50%; animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
.modal-card { max-width:500px; width:100%; max-height:90vh; overflow-y:auto; }
.modal-content { padding:1.5rem; }
.separator { border:none; border-top:1px solid #e5e7eb; margin:0.75rem 0; }
  `]
})
export class PagosViewComponent implements OnInit {
  state = inject(AppStateService);
  mockData = inject(MockDataService);
  facturasService = inject(FacturasService);
  pagosService = inject(PagosService);
  reportesService = inject(ReportesService);

  tab = signal('facturas');
  monto = '';
  metodoPago = 'qr';
  comprobanteSubido = false;
  periodoReporte = 'hoy';
  busqueda = '';

  facturas = signal<Factura[]>([]);
  facturasFiltradas = signal<Factura[]>([]);
  filtroEstado = signal<'todos' | 'enviadas' | 'pendientes'>('todos');
  loading = signal(false);
  error = signal<string | null>(null);
  stats = signal<any>(null);
  facturaSeleccionada = signal<Factura | null>(null);
  enviandoFactura = signal<string | null>(null);
  exportando = signal<string | null>(null);

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [facturasData, statsData] = await Promise.all([
        this.facturasService.listar().toPromise(),
        this.facturasService.getStats().toPromise()
      ]);
      this.facturas.set(facturasData ?? []);
      this.filtrarFacturas();
      this.stats.set(statsData);
    } catch (e) {
      this.error.set('Error al cargar los datos');
      this.facturas.set([...this.mockData.facturas]);
      this.filtrarFacturas();
    } finally {
      this.loading.set(false);
    }
  }

  filtrarFacturas() {
    let filtradas = this.facturas();

    // Filtro por búsqueda
    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase();
      filtradas = filtradas.filter(f =>
        f.cliente?.nombre?.toLowerCase().includes(termino) ||
        f.cliente?.telefono?.includes(termino) ||
        f.id?.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado() === 'enviadas') {
      filtradas = filtradas.filter(f => f.enviada);
    } else if (this.filtroEstado() === 'pendientes') {
      filtradas = filtradas.filter(f => !f.enviada);
    }

    this.facturasFiltradas.set(filtradas);
  }

  setFiltroEstado(estado: 'todos' | 'enviadas' | 'pendientes') {
    this.filtroEstado.set(estado);
    this.filtrarFacturas();
  }

  get ingresosTotal() {
    return this.facturas().reduce((s, f) => s + f.monto, 0);
  }

  get resumen() {
    const facturas = this.facturas();
    return [
      { icon: 'qr', label: 'Pagos por QR', bg: '#dcfce7', color: '#16a34a', monto: facturas.filter(f => f.metodoPago === 'qr').reduce((s, f) => s + f.monto, 0) },
      { icon: 'card', label: 'Pagos con Tarjeta', bg: '#dbeafe', color: '#2563eb', monto: facturas.filter(f => f.metodoPago === 'tarjeta').reduce((s, f) => s + f.monto, 0) },
      { icon: 'money', label: 'Ingresos Totales del Día', bg: 'linear-gradient(135deg,#2563eb,#22c55e)', color: 'white', monto: facturas.reduce((s, f) => s + f.monto, 0) },
    ];
  }

  async confirmarPago() {
    const solicitud = this.state.solicitudActiva();
    if (!solicitud || !this.monto) return;

    const montoNum = parseFloat(this.monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.pagosService.confirmarPago(solicitud.id, montoNum).toPromise();
      this.state.confirmarPago();
      this.monto = '';
      this.comprobanteSubido = false;
      await this.cargarDatos();
      alert(`Monto confirmado: Bs. ${response?.total || montoNum}. El cliente ha sido notificado para proceder al pago.`);
    } catch (err: any) {
      this.error.set('Error al confirmar pago: ' + (err.error?.detail || err.message));
    } finally {
      this.loading.set(false);
    }
  }

  verFactura(factura: Factura) {
    this.facturaSeleccionada.set(factura);
  }

  cerrarModalFactura() {
    this.facturaSeleccionada.set(null);
  }

  async enviarFactura(factura: Factura) {
    if (!factura.id) return;
    this.enviandoFactura.set(factura.id);
    try {
      await this.facturasService.enviar(factura.id).toPromise();
      await this.cargarDatos();
      alert('Factura marcada como enviada');
    } catch (err: any) {
      alert('Error al enviar factura: ' + (err.error?.detail || err.message));
    } finally {
      this.enviandoFactura.set(null);
    }
  }

  imprimirFactura(factura: Factura) {
    const ventana = window.open('', '_blank');
    if (!ventana) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Factura #${factura.id?.slice(-8)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .header h1 { color: #2563eb; margin: 0; }
    .header p { color: #6b7280; margin: 0.5rem 0; }
    .section { margin-bottom: 1.5rem; }
    .section h3 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
    .row { display: flex; justify-content: space-between; padding: 0.5rem 0; }
    .row.total { font-weight: bold; font-size: 1.2rem; border-top: 2px solid #2563eb; padding-top: 1rem; margin-top: 1rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; }
    .badge-enviada { background: #dcfce7; color: #166534; }
    .badge-pendiente { background: #fef3c7; color: #92400e; }
    .footer { text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ASISTEGO</h1>
    <p>Santa Cruz, Bolivia</p>
    <p>Factura #${factura.id?.slice(-8).toUpperCase()}</p>
  </div>

  <div class="section">
    <h3>Cliente</h3>
    <p><strong>${factura.cliente?.nombre || 'Cliente'}</strong></p>
    <p>${factura.cliente?.telefono || ''}</p>
    <p>${factura.cliente?.email || ''}</p>
  </div>

  <div class="section">
    <h3>Detalle del Servicio</h3>
    <div class="row"><span>Monto del servicio:</span><span>Bs. ${factura.monto.toFixed(2)}</span></div>
    <div class="row"><span>Comisión (10%):</span><span>Bs. ${(factura.comision || factura.monto * 0.1).toFixed(2)}</span></div>
    <div class="row total"><span>Total:</span><span>Bs. ${(factura.total || factura.monto * 1.1).toFixed(2)}</span></div>
  </div>

  <div class="section">
    <h3>Información de Pago</h3>
    <div class="row"><span>Método:</span><span>${(factura.metodoPago || 'Efectivo').toUpperCase()}</span></div>
    <div class="row"><span>Estado:</span><span class="badge ${factura.enviada ? 'badge-enviada' : 'badge-pendiente'}">${factura.enviada ? 'Enviada' : 'Pendiente'}</span></div>
    <div class="row"><span>Fecha:</span><span>${new Date(factura.fecha || Date.now()).toLocaleString('es-BO')}</span></div>
  </div>

  <div class="footer">
    <p>Gracias por confiar en Asistego</p>
    <p>Servicio de asistencia vehicular 24/7</p>
    <button class="no-print" onclick="window.print()" style="margin-top:1rem;padding:0.5rem 1rem;background:#2563eb;color:white;border:none;border-radius:0.375rem;cursor:pointer;">Imprimir Factura</button>
  </div>
</body>
</html>`;
    ventana.document.write(html);
    ventana.document.close();
  }

  actualizarReporte() {
    // La selección de período está lista para cuando se conecte con el backend
    console.log('Período seleccionado:', this.periodoReporte);
  }

  async exportarPDF() {
    this.exportando.set('pdf');
    try {
      const facturas = this.facturas();
      const ventana = window.open('', '_blank');
      if (!ventana) throw new Error('No se pudo abrir ventana');

      let facturasHtml = facturas.map(f => `
        <tr>
          <td>${f.id?.slice(-8).toUpperCase()}</td>
          <td>${f.cliente?.nombre || 'Cliente'}</td>
          <td>${(f.metodoPago || 'Efectivo').toUpperCase()}</td>
          <td>Bs. ${f.monto.toFixed(2)}</td>
          <td>Bs. ${(f.comision || f.monto * 0.1).toFixed(2)}</td>
          <td>Bs. ${(f.total || f.monto * 1.1).toFixed(2)}</td>
          <td>${f.enviada ? '✓ Enviada' : '⏳ Pendiente'}</td>
        </tr>
      `).join('');

      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Reporte de Facturas - Asistego</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    h1 { color: #2563eb; margin: 0; }
    .meta { color: #6b7280; margin: 0.5rem 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #eff6ff; color: #1e40af; font-weight: 600; }
    tr:hover { background: #f9fafb; }
    .total { text-align: right; font-size: 1.1rem; font-weight: bold; margin-top: 1rem; }
    .no-print { margin-top: 2rem; text-align: center; }
    button { padding: 0.75rem 1.5rem; background: #dc2626; color: white; border: none; border-radius: 0.375rem; cursor: pointer; margin: 0.25rem; }
    .btn-print { background: #2563eb; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>ASISTEGO - Reporte de Facturas</h1>
    <p class="meta">Santa Cruz, Bolivia</p>
    <p class="meta">Período: ${this.periodoReporte.toUpperCase()} | Generado: ${new Date().toLocaleString('es-BO')}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Factura</th>
        <th>Cliente</th>
        <th>Método</th>
        <th>Monto</th>
        <th>Comisión</th>
        <th>Total</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>${facturasHtml}</tbody>
  </table>
  <p class="total">Total Ingresos: Bs. ${this.ingresosTotal.toFixed(2)} | Comisiones: Bs. ${(this.ingresosTotal * 0.1).toFixed(2)} | Neto: Bs. ${(this.ingresosTotal * 0.9).toFixed(2)}</p>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨 Imprimir</button>
    <button onclick="window.close()">✕ Cerrar</button>
  </div>
</body>
</html>`;
      ventana.document.write(html);
      ventana.document.close();
    } catch (err) {
      alert('Error al generar PDF');
    } finally {
      this.exportando.set(null);
    }
  }

  async exportarExcel() {
    this.exportando.set('excel');
    try {
      const facturas = this.facturas();
      const csv = [
        ['Factura', 'Cliente', 'Telefono', 'Email', 'Metodo Pago', 'Monto', 'Comision', 'Total', 'Estado', 'Fecha'].join(','),
        ...facturas.map(f => [
          f.id?.slice(-8).toUpperCase(),
          `"${f.cliente?.nombre || 'Cliente'}"`,
          f.cliente?.telefono || '',
          f.cliente?.email || '',
          f.metodoPago || 'Efectivo',
          f.monto.toFixed(2),
            (f.comision || f.monto * 0.1).toFixed(2),
            (f.total || f.monto * 1.1).toFixed(2),
          f.enviada ? 'Enviada' : 'Pendiente',
          new Date(f.fecha || Date.now()).toLocaleDateString('es-BO')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `asistego-facturas-${this.periodoReporte}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      alert('Error al exportar Excel');
    } finally {
      this.exportando.set(null);
    }
  }

  exportarImprimible() {
    this.exportando.set('print');
    this.exportarPDF(); // Usa el mismo formato pero enfocado en impresión
    setTimeout(() => this.exportando.set(null), 1000);
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
    <div><h2>Repuestos</h2><p class="text-sm text-gray-500">Santa Cruz, Bolivia - Gestiona tu inventario</p></div>
    <button class="btn btn-primary" (click)="abrirModalCrear()">+ Agregar Repuesto</button>
  </div>

  <!-- Loading y Error -->
  <div *ngIf="loading()" class="card" style="padding:1rem;text-align:center">
    <span>Cargando repuestos...</span>
  </div>
  <div *ngIf="error()" class="card" style="padding:1rem;background:#fef2f2;border-color:#fecaca;color:#dc2626">
    {{ error() }}
  </div>

  <!-- Inventario -->
  <ng-container>
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
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
            <span class="font-medium text-gray-900">Bs. {{ r.precio }}</span>
            <span class="text-xs text-gray-500">Stock: {{ r.stock || 0 }}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
            <span class="text-xs text-gray-500">{{ r.marca }}</span>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-outline btn-sm" style="flex:1" (click)="abrirModalEditar(r)">✏️ Editar</button>
            <button class="btn btn-outline btn-sm" style="flex:1" (click)="toggleDisponibilidad(r)">
              {{ r.disponible ? '🔴 Desactivar' : '🟢 Activar' }}
            </button>
            <button class="btn btn-outline btn-sm text-red-600" style="flex:1" (click)="eliminarRepuesto(r)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="repuestosFiltrados.length === 0 && !loading()" class="card" style="padding:3rem;text-align:center">
      <div style="font-size:3rem;margin-bottom:1rem">📦</div>
      <h3>No hay repuestos</h3>
      <p class="text-sm text-gray-500">Agrega tu primer repuesto al inventario</p>
    </div>
  </ng-container>
</div>

<!-- Modal CRUD Repuesto -->
<div *ngIf="showModal()" class="modal-overlay" (click)="cerrarModal()">
  <div class="card modal-card" (click)="$event.stopPropagation()" style="width:500px;max-width:90vw;max-height:90vh;overflow-y:auto">
    <div style="padding:1.5rem">
      <h3 style="margin-bottom:1rem">{{ modoModal() === 'crear' ? 'Agregar Repuesto' : 'Editar Repuesto' }}</h3>
      
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div>
          <label class="label">Nombre *</label>
          <input class="input" [(ngModel)]="repuestoForm.nombre" placeholder="Ej: Batería 12V" />
        </div>
        <div>
          <label class="label">Descripción</label>
          <textarea class="input" [(ngModel)]="repuestoForm.descripcion" rows="3" placeholder="Descripción del repuesto..."></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div>
            <label class="label">Precio (Bs.) *</label>
            <input class="input" type="number" [(ngModel)]="repuestoForm.precio" placeholder="0.00" min="0" step="0.01" />
          </div>
          <div>
            <label class="label">Stock *</label>
            <input class="input" type="number" [(ngModel)]="repuestoForm.stock" placeholder="0" min="0" />
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div>
            <label class="label">Categoría *</label>
            <select class="select" [(ngModel)]="repuestoForm.categoria" style="width:100%">
              <option value="">Seleccionar...</option>
              <option value="Motor">Motor</option>
              <option value="Frenos">Frenos</option>
              <option value="Suspensión">Suspensión</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Transmisión">Transmisión</option>
              <option value="Carrocería">Carrocería</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div>
            <label class="label">Marca</label>
            <input class="input" [(ngModel)]="repuestoForm.marca" placeholder="Ej: Bosch, Denso..." />
          </div>
        </div>
        <div>
          <label class="label">URL de Imagen</label>
          <input class="input" [(ngModel)]="repuestoForm.imagen" placeholder="https://..." />
        </div>
        <div>
          <label class="label">Vehículos Compatibles (separados por coma)</label>
          <input class="input" [(ngModel)]="repuestoForm.vehiculosCompatibles" placeholder="Toyota, Honda, Nissan..." />
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <input type="checkbox" id="disponible" [(ngModel)]="repuestoForm.disponible" />
          <label for="disponible" style="cursor:pointer">Disponible para venta</label>
        </div>
      </div>

      <div *ngIf="modalError()" style="margin-top:1rem;padding:0.75rem;background:#fef2f2;border:1px solid #fecaca;border-radius:0.5rem;color:#dc2626;font-size:0.875rem">
        {{ modalError() }}
      </div>

      <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
        <button class="btn btn-outline" style="flex:1" (click)="cerrarModal()">Cancelar</button>
        <button class="btn btn-primary" style="flex:1" [disabled]="guardando()" (click)="guardarRepuesto()">
          {{ guardando() ? 'Guardando...' : (modoModal() === 'crear' ? 'Crear Repuesto' : 'Guardar Cambios') }}
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.view-padded { flex:1; padding:1.5rem; display:flex; flex-direction:column; gap:1.5rem; overflow-y:auto; }
.repuestos-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.rep-card { overflow:hidden; }
.rep-img { width:100%; height:192px; object-fit:cover; }
.rep-placeholder { width:100%; height:192px; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-size:4rem; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-card { animation:modalIn 0.2s ease-out; }
@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
.text-red-600 { color:#dc2626; }
.label { display:block; font-size:0.875rem; font-weight:500; color:#374151; margin-bottom:0.375rem; }
  `]
})
export class RepuestosViewComponent implements OnInit {
  mockData = inject(MockDataService);
  repuestosService = inject(RepuestosService);
  busqueda = '';
  categoria = 'todas';

  repuestos = signal<Repuesto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Modal state
  showModal = signal(false);
  modoModal = signal<'crear' | 'editar'>('crear');
  guardando = signal(false);
  modalError = signal<string | null>(null);
  repuestoEditando: Repuesto | null = null;

  repuestoForm = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: '',
    marca: '',
    imagen: '',
    disponible: true,
    vehiculosCompatibles: ''
  };

  ngOnInit() {
    this.cargarRepuestos();
  }

  async cargarRepuestos() {
    this.loading.set(true);
    try {
      const data = await this.repuestosService.listar().toPromise();
      this.repuestos.set(data ?? []);
      this.error.set(null);
    } catch (e: any) {
      this.error.set(e.message || 'Error al cargar repuestos');
      this.repuestos.set([...this.mockData.repuestos]);
    } finally {
      this.loading.set(false);
    }
  }

  get categorias() {
    const cats = Array.from(new Set(this.repuestos().map(r => r.categoria)));
    return ['todas', ...cats];
  }

  get repuestosFiltrados() {
    return this.repuestos().filter(r => {
      const mb = r.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                 r.descripcion?.toLowerCase().includes(this.busqueda.toLowerCase());
      const mc = this.categoria === 'todas' || r.categoria === this.categoria;
      return mb && mc;
    });
  }

  abrirModalCrear() {
    this.modoModal.set('crear');
    this.repuestoEditando = null;
    this.repuestoForm = {
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      categoria: '',
      marca: '',
      imagen: '',
      disponible: true,
      vehiculosCompatibles: ''
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  abrirModalEditar(repuesto: Repuesto) {
    this.modoModal.set('editar');
    this.repuestoEditando = repuesto;
    this.repuestoForm = {
      nombre: repuesto.nombre,
      descripcion: repuesto.descripcion || '',
      precio: repuesto.precio,
      stock: repuesto.stock || 0,
      categoria: repuesto.categoria || '',
      marca: repuesto.marca || '',
      imagen: repuesto.imagen || '',
      disponible: repuesto.disponible ?? true,
      vehiculosCompatibles: repuesto.vehiculosCompatibles?.join(', ') || ''
    };
    this.modalError.set(null);
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.repuestoEditando = null;
    this.modalError.set(null);
  }

  async guardarRepuesto() {
    // Validación
    if (!this.repuestoForm.nombre.trim()) {
      this.modalError.set('El nombre es requerido');
      return;
    }
    if (!this.repuestoForm.categoria) {
      this.modalError.set('La categoría es requerida');
      return;
    }
    if (this.repuestoForm.precio <= 0) {
      this.modalError.set('El precio debe ser mayor a 0');
      return;
    }
    if (this.repuestoForm.stock < 0) {
      this.modalError.set('El stock no puede ser negativo');
      return;
    }

    this.guardando.set(true);
    this.modalError.set(null);

    const vehiculos = this.repuestoForm.vehiculosCompatibles
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    const data = {
      nombre: this.repuestoForm.nombre,
      descripcion: this.repuestoForm.descripcion,
      precio: this.repuestoForm.precio,
      stock: this.repuestoForm.stock,
      categoria: this.repuestoForm.categoria,
      marca: this.repuestoForm.marca,
      imagen: this.repuestoForm.imagen || undefined,
      disponible: this.repuestoForm.disponible,
      vehiculos_compatibles: vehiculos
    };

    try {
      if (this.modoModal() === 'crear') {
        await this.repuestosService.crear(data as any).toPromise();
      } else if (this.repuestoEditando) {
        await this.repuestosService.actualizar(this.repuestoEditando.id, data as any).toPromise();
      }
      this.cerrarModal();
      await this.cargarRepuestos();
    } catch (e: any) {
      this.modalError.set(e.error?.detail || e.message || 'Error al guardar el repuesto');
    } finally {
      this.guardando.set(false);
    }
  }

  async toggleDisponibilidad(repuesto: Repuesto) {
    try {
      await this.repuestosService.actualizar(repuesto.id, {
        disponible: !repuesto.disponible
      } as any).toPromise();
      await this.cargarRepuestos();
    } catch (e: any) {
      this.error.set('Error al actualizar disponibilidad: ' + (e.error?.detail || e.message));
    }
  }

  async eliminarRepuesto(repuesto: Repuesto) {
    if (!confirm(`¿Estás seguro de eliminar "${repuesto.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await this.repuestosService.eliminar(repuesto.id).toPromise();
      await this.cargarRepuestos();
    } catch (e: any) {
      this.error.set('Error al eliminar: ' + (e.error?.detail || e.message));
    }
  }

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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
        <h3>Clientes</h3>
        <button class="btn btn-primary btn-sm" (click)="nuevoCliente()">+ Nuevo</button>
      </div>
      <div style="position:relative">
        <span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af">🔍</span>
        <input class="input" [(ngModel)]="busqueda" placeholder="Buscar cliente..." style="padding-left:2.25rem" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto">
      <button *ngFor="let c of filtrados" (click)="seleccionarCliente(c)"
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
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-outline" (click)="editarCliente()">✏️ Editar</button>
            <button class="btn btn-outline">📞 Llamar</button>
          </div>
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
export class ClientesViewComponent implements OnInit {
  mockData = inject(MockDataService);
  clientesService = inject(ClientesService);
  busqueda = '';
  seleccionado = signal<Cliente | null>(null);

  clientes = signal<Cliente[]>([]);
  loading = signal(false);
  servicios = signal<Servicio[]>([]);

  ngOnInit() {
    this.cargarClientes();
  }

  async cargarClientes() {
    this.loading.set(true);
    try {
      const data = await this.clientesService.listar().toPromise();
      this.clientes.set(data ?? []);
    } catch (e) {
      this.clientes.set([...this.mockData.clientes]);
    } finally {
      this.loading.set(false);
    }
  }

  async seleccionarCliente(cliente: Cliente) {
    this.seleccionado.set(cliente);
    try {
      const data = await this.clientesService.getServicios(cliente.id).toPromise();
      this.servicios.set(data ?? []);
    } catch (e) {
      this.servicios.set(this.mockData.servicios.filter(s => s.cliente.id === cliente.id));
    }
  }

  get filtrados() {
    return this.clientes().filter(c =>
      c.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      c.telefono.includes(this.busqueda)
    );
  }

  get serviciosCliente() {
    return this.seleccionado() ? this.servicios() : [];
  }

  get totalGastado() {
    return this.serviciosCliente.reduce((s, v) => s + v.monto, 0);
  }

  nuevoCliente() {
    // Por ahora solo log - en producción abrir modal
    console.log('Nuevo cliente - implementar modal');
    alert('Función: Crear nuevo cliente\n\nImplementar modal con formulario para:\n- Nombre\n- Teléfono\n- Email\n- Foto (opcional)');
  }

  editarCliente() {
    const cliente = this.seleccionado();
    if (!cliente) return;
    
    // Por ahora solo log - en producción abrir modal
    console.log('Editar cliente:', cliente);
    alert(`Función: Editar cliente\n\nCliente: ${cliente.nombre}\n\nImplementar modal para editar datos.`);
  }
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
      <select class="select" [(ngModel)]="filtroTiempo" (change)="aplicarFiltros()" style="width:192px">
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
export class HistorialViewComponent implements OnInit {
  mockData = inject(MockDataService);
  serviciosService = inject(ServiciosService);
  busqueda = '';
  filtroTiempo = 'todos';

  servicios = signal<Servicio[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.cargarServicios();
  }

  async cargarServicios() {
    this.loading.set(true);
    try {
      // Calcular fechas según filtro
      let desde: string | undefined;
      let hasta: string | undefined;
      const hoy = new Date();
      
      if (this.filtroTiempo === 'hoy') {
        desde = hoy.toISOString().split('T')[0];
        hasta = desde;
      } else if (this.filtroTiempo === 'semana') {
        const semanaAtras = new Date(hoy);
        semanaAtras.setDate(hoy.getDate() - 7);
        desde = semanaAtras.toISOString().split('T')[0];
        hasta = hoy.toISOString().split('T')[0];
      } else if (this.filtroTiempo === 'mes') {
        const mesAtras = new Date(hoy);
        mesAtras.setDate(hoy.getDate() - 30);
        desde = mesAtras.toISOString().split('T')[0];
        hasta = hoy.toISOString().split('T')[0];
      }
      
      const params: any = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (this.busqueda) params.q = this.busqueda;
      
      const data = await this.serviciosService.listar(params).toPromise();
      this.servicios.set(data ?? []);
    } catch (e) {
      this.servicios.set([...this.mockData.servicios]);
    } finally {
      this.loading.set(false);
    }
  }
  
  aplicarFiltros() {
    this.cargarServicios();
  }

  get filtrados() {
    return this.servicios().filter((s: any) => {
      const mb = s.cliente?.nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                 s.problema?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
                 s.vehiculo?.marca?.toLowerCase().includes(this.busqueda.toLowerCase());
      let mt = true;
      if (this.filtroTiempo !== 'todos') {
        const fecha = s.fecha instanceof Date ? s.fecha : new Date(s.fecha);
        const dias = Math.floor((Date.now() - fecha.getTime()) / 86400000);
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
      { icon: '💰', label: 'Ingresos Totales', value: `Bs. ${f.reduce((s, v) => s + (v.monto || 0), 0)}`, bg: '#dcfce7' },
      { icon: '📊', label: 'Promedio/Servicio', value: `Bs. ${(f.length > 0 ? f.reduce((s, v) => s + (v.monto || 0), 0) / f.length : 0).toFixed(2)}`, bg: '#f3e8ff' },
      { icon: '⏱', label: 'Tiempo Total', value: `${f.reduce((s, v) => s + (v.duracion || 0), 0)} min`, bg: '#ffedd5' },
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
      <div><h2>Solicitudes Cercanas</h2><p class="text-sm text-gray-500">{{ solicitudes().length }} solicitudes pendientes</p></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <div *ngFor="let s of solicitudes()" class="card notif-card" (click)="verSolicitud(s)">
        <div style="display:flex;gap:1rem">
          <div class="notif-icon" [style.background]="s.tipo === 'grua' ? '#fee2e2' : '#dbeafe'">
            {{ s.tipo === 'grua' ? '🚛' : '🚗' }}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.25rem">
              <p class="font-medium text-gray-900">{{ s.cliente.nombre }}</p>
              <span class="text-xs font-medium" [style.color]="s.tipo === 'grua' ? '#dc2626' : '#2563eb'">{{ s.distancia }} km</span>
            </div>
            <p class="text-sm text-gray-600" style="margin-bottom:0.5rem">{{ s.analisisIA?.tipoProblema || s.problema || s.descripcion }}</p>
            <div style="display:flex;align-items:center;gap:0.75rem">
              <span class="text-xs text-gray-500">{{ formatTime(s.timestamp) }}</span>
              <span class="badge badge-outline text-xs" [style.color]="s.tipo === 'grua' ? '#dc2626' : '#2563eb'" [style.border-color]="s.tipo === 'grua' ? '#dc2626' : '#2563eb'">{{ s.tipo === 'grua' ? 'GRÚA' : 'NORMAL' }}</span>
              <span class="badge badge-outline text-xs" style="color:#6b7280;border-color:#6b7280">{{ s.vehiculo.marca }} {{ s.vehiculo.modelo }}</span>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="solicitudes().length === 0" style="text-align:center;padding:3rem;color:#6b7280">
        <div style="font-size:3rem;margin-bottom:1rem">🔔</div>
        <h3>No hay solicitudes cercanas</h3>
        <p class="text-sm">Las nuevas solicitudes aparecerán aquí</p>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.notif-card { padding:1rem; cursor:pointer; transition:all 0.15s; }
.notif-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); background:#eff6ff; border-color:#bfdbfe; }
.notif-icon { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
  `]
})
export class NotificacionesViewComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  solicitudesService = inject(SolicitudesService);

  solicitudes = signal<Solicitud[]>([]);
  private pollingInterval: any;

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.pollingInterval = setInterval(() => this.cargarSolicitudes(), 2000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  cargarSolicitudes(): void {
    this.solicitudesService.listar({ pendientes: true }).subscribe({
      next: (data) => this.solicitudes.set(data),
      error: () => this.solicitudes.set([])
    });
  }

  verSolicitud(s: Solicitud): void {
    this.state.seleccionarSolicitudPendiente(s);
  }

  formatTime(d: Date) {
    const diff = (Date.now() - new Date(d).getTime()) / 60000;
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
  imports: [CommonModule, FormsModule],
  template: `
<div style="flex:1;padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;overflow-y:auto">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div><h2>Personal</h2><p class="text-sm text-gray-500">Santa Cruz, Bolivia</p></div>
    <button class="btn btn-primary" (click)="openCreateModal()">+ Agregar Personal</button>
  </div>

  <div class="stats4">
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Total Personal</p><p class="stat-val">{{ personal().length }}</p></div>
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Disponibles</p><p class="stat-val">{{ disponibles }}</p></div>
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Asistencias Hoy</p><p class="stat-val">{{ asistenciasDia }}</p></div>
    <div class="card" style="padding:1rem"><p class="text-sm text-gray-500">Asistencias Mes</p><p class="stat-val">{{ asistenciasMes }}</p></div>
  </div>

  <div class="tabs-list">
    <button class="tabs-trigger" [class.active]="tab() === 'operativo'" (click)="tab.set('operativo')">Personal Operativo</button>
    <button class="tabs-trigger" [class.active]="tab() === 'administrativo'" (click)="tab.set('administrativo')">Personal Administrativo</button>
  </div>

  <div class="personal-grid">
    <div *ngFor="let p of tabPersonal" class="card pers-card">
      <div style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:1rem">
        <img [src]="p.foto" [alt]="p.nombre" style="width:64px;height:64px;border-radius:50%;object-fit:cover" />
        <div style="flex:1"><h3 style="margin-bottom:0.25rem">{{ p.nombre }}</h3><span class="badge badge-outline">{{ rolLabel(p.rol) }}</span></div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-outline btn-sm" (click)="openEditModal(p)" title="Editar">✏</button>
          <button class="btn btn-outline btn-sm" (click)="confirmDelete(p)" title="Eliminar" style="color:#dc2626">🗑</button>
        </div>
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

  <!-- Loading -->
  <div *ngIf="loading()" style="text-align:center;padding:3rem">
    <div class="spinner"></div>
    <p class="text-sm text-gray-500" style="margin-top:1rem">Cargando personal...</p>
  </div>
</div>

<!-- Modal Formulario Crear/Editar -->
<div *ngIf="showFormModal()" class="modal-overlay" (click)="closeFormModal()">
  <div class="card" style="width:100%;max-width:500px;padding:1.5rem;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
    <h3 style="margin-bottom:1.5rem">{{ editingPersonal() ? 'Editar' : 'Nuevo' }} Personal</h3>

    <div *ngIf="formError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
      {{ formError() }}
    </div>

    <div style="display:flex;flex-direction:column;gap:1rem">
      <div>
        <label class="label">Nombre completo *</label>
        <input class="input" [(ngModel)]="formData.nombre" placeholder="Ej: José Martínez" style="margin-top:0.25rem" />
      </div>

      <div>
        <label class="label">Rol *</label>
        <select class="select" [(ngModel)]="formData.rol" style="margin-top:0.25rem">
          <option value="mecanico">Mecánico</option>
          <option value="electrico">Eléctrico</option>
          <option value="grua">Grúa</option>
          <option value="administrador">Administrador</option>
          <option value="encargado">Encargado</option>
        </select>
      </div>

      <div>
        <label class="label">Estado</label>
        <select class="select" [(ngModel)]="formData.estado" style="margin-top:0.25rem">
          <option value="disponible">Disponible</option>
          <option value="ocupado">Ocupado</option>
          <option value="en_camino">En camino</option>
          <option value="regresando">Regresando</option>
        </select>
      </div>

      <div>
        <label class="label">Teléfono</label>
        <input class="input" [(ngModel)]="formData.telefono" placeholder="Ej: +591 7111 2222" style="margin-top:0.25rem" />
      </div>

      <div>
        <label class="label">Foto (URL)</label>
        <input class="input" [(ngModel)]="formData.foto" placeholder="https://..." style="margin-top:0.25rem" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <label class="label">Asistencias Hoy</label>
          <input type="number" class="input" [(ngModel)]="formData.asistenciasDia" style="margin-top:0.25rem" />
        </div>
        <div>
          <label class="label">Asistencias Mes</label>
          <input type="number" class="input" [(ngModel)]="formData.asistenciasMes" style="margin-top:0.25rem" />
        </div>
      </div>
    </div>

    <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
      <button class="btn btn-primary" style="flex:1" (click)="submitForm()" [disabled]="formLoading()">
        <span *ngIf="!formLoading()">{{ editingPersonal() ? 'Guardar Cambios' : 'Crear Personal' }}</span>
        <span *ngIf="formLoading()">Guardando...</span>
      </button>
      <button class="btn btn-outline" style="flex:1" (click)="closeFormModal()">Cancelar</button>
    </div>
  </div>
</div>

<!-- Modal Confirmar Eliminación -->
<div *ngIf="showDeleteModal()" class="modal-overlay" (click)="closeDeleteModal()">
  <div class="card" style="width:100%;max-width:400px;padding:1.5rem;text-align:center" (click)="$event.stopPropagation()">
    <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
    <h3 style="margin-bottom:0.5rem">¿Eliminar personal?</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1.5rem">Esta acción no se puede deshacer. {{ personalToDelete()?.nombre }} será eliminado permanentemente.</p>

    <div *ngIf="deleteError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
      {{ deleteError() }}
    </div>

    <div style="display:flex;gap:0.75rem">
      <button class="btn btn-outline" style="flex:1" (click)="closeDeleteModal()">Cancelar</button>
      <button class="btn btn-primary" style="flex:1;background:#dc2626;border-color:#dc2626" (click)="deletePersonal()" [disabled]="deleteLoading()">
        <span *ngIf="!deleteLoading()">Sí, Eliminar</span>
        <span *ngIf="deleteLoading()">Eliminando...</span>
      </button>
    </div>
  </div>
</div>
`,
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
export class PersonalViewComponent implements OnInit {
  mockData = inject(MockDataService);
  personalService = inject(PersonalService);
  tab = signal('operativo');
  selected = signal<Personal | null>(null);

  personal = signal<Personal[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.cargarPersonal();
  }

  async cargarPersonal() {
    this.loading.set(true);
    try {
      const data = await this.personalService.listar().toPromise();
      this.personal.set(data ?? []);
    } catch (e) {
      this.personal.set([...this.mockData.personal]);
    } finally {
      this.loading.set(false);
    }
  }

  get tabPersonal() {
    const rolesOperativos = ['mecanico', 'electrico', 'grua'];
    return this.tab() === 'operativo'
      ? this.personal().filter(p => rolesOperativos.includes(p.rol))
      : this.personal().filter(p => !rolesOperativos.includes(p.rol));
  }

  get disponibles() {
    return this.personal().filter(p => p.estado === 'disponible').length;
  }

  get asistenciasDia() {
    return this.personal().filter(p => p.estado).reduce((s, p) => s + p.asistenciasDia, 0);
  }

  get asistenciasMes() {
    return this.personal().filter(p => p.estado).reduce((s, p) => s + p.asistenciasMes, 0);
  }

  rolLabel(rol: string) { return ({ mecanico: 'Mecánico', electrico: 'Eléctrico', grua: 'Grúa', administrador: 'Administrador', encargado: 'Encargado' } as any)[rol] ?? rol; }
  estadoColor(e: string) { return ({ disponible: '#22c55e', ocupado: '#ef4444', en_camino: '#eab308', regresando: '#06b6d4' } as any)[e] ?? '#9ca3af'; }
  estadoLabel(e: string) { return ({ disponible: 'Disponible', ocupado: 'Ocupado', en_camino: 'En camino', regresando: 'Regresando al taller' } as any)[e] ?? e; }

  // Signals para CRUD
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  editingPersonal = signal<Personal | null>(null);
  personalToDelete = signal<Personal | null>(null);
  formLoading = signal(false);
  deleteLoading = signal(false);
  formError = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  formData = {
    nombre: '',
    rol: 'mecanico' as RolPersonal,
    estado: 'disponible' as EstadoPersonal,
    telefono: '',
    foto: '',
    asistenciasDia: 0,
    asistenciasMes: 0
  };

  resetForm() {
    this.formData = {
      nombre: '',
      rol: 'mecanico',
      estado: 'disponible',
      telefono: '',
      foto: '',
      asistenciasDia: 0,
      asistenciasMes: 0
    };
  }

  openCreateModal() {
    this.resetForm();
    this.editingPersonal.set(null);
    this.formError.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(p: Personal) {
    this.formData = {
      nombre: p.nombre,
      rol: p.rol,
      estado: p.estado || 'disponible',
      telefono: p.telefono || '',
      foto: p.foto || '',
      asistenciasDia: p.asistenciasDia || 0,
      asistenciasMes: p.asistenciasMes || 0
    };
    this.editingPersonal.set(p);
    this.formError.set(null);
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
    this.formError.set(null);
    this.editingPersonal.set(null);
  }

  validateForm(): boolean {
    if (!this.formData.nombre.trim()) {
      this.formError.set('El nombre es obligatorio');
      return false;
    }
    if (!this.formData.rol) {
      this.formError.set('El rol es obligatorio');
      return false;
    }
    return true;
  }

  async submitForm() {
    if (!this.validateForm()) return;

    this.formLoading.set(true);
    this.formError.set(null);

    try {
      if (this.editingPersonal()) {
        // Actualizar
        const p = this.editingPersonal()!;
        await this.personalService.actualizar(p.id, {
          nombre: this.formData.nombre,
          rol: this.formData.rol,
          estado: this.formData.estado,
          telefono: this.formData.telefono,
          foto: this.formData.foto,
          asistencias_dia: this.formData.asistenciasDia,
          asistencias_mes: this.formData.asistenciasMes
        }).toPromise();

        this.personal.update(list =>
          list.map(person =>
            person.id === p.id
              ? {
                  ...person,
                  nombre: this.formData.nombre,
                  rol: this.formData.rol,
                  estado: this.formData.estado,
                  telefono: this.formData.telefono,
                  foto: this.formData.foto,
                  asistenciasDia: this.formData.asistenciasDia,
                  asistenciasMes: this.formData.asistenciasMes
                }
              : person
          )
        );
      } else {
        // Crear nuevo
        const nuevo = await this.personalService.crear({
          nombre: this.formData.nombre,
          rol: this.formData.rol,
          estado: this.formData.estado,
          telefono: this.formData.telefono,
          foto: this.formData.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
          asistencias_dia: this.formData.asistenciasDia,
          asistencias_mes: this.formData.asistenciasMes
        }).toPromise();

        if (nuevo) {
          this.personal.update(list => [...list, nuevo]);
        }
      }

      this.closeFormModal();
    } catch (e: any) {
      console.error('Error al guardar personal:', e);
      this.formError.set(e.error?.detail || 'Error al guardar el personal');
    } finally {
      this.formLoading.set(false);
    }
  }

  confirmDelete(p: Personal) {
    this.personalToDelete.set(p);
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.personalToDelete.set(null);
    this.deleteError.set(null);
  }

  async deletePersonal() {
    const p = this.personalToDelete();
    if (!p) return;

    this.deleteLoading.set(true);
    this.deleteError.set(null);

    try {
      await this.personalService.eliminar(p.id).toPromise();
      this.personal.update(list => list.filter(person => person.id !== p.id));
      this.closeDeleteModal();
    } catch (e: any) {
      console.error('Error al eliminar personal:', e);
      this.deleteError.set(e.error?.detail || 'Error al eliminar el personal');
    } finally {
      this.deleteLoading.set(false);
    }
  }

  async cambiarEstadoPersonal() {
    const p = this.selected();
    if (!p) return;

    const nuevoEstado = p.estado === 'disponible' ? 'ocupado' : 'disponible';

    try {
      await this.personalService.cambiarEstado(p.id, nuevoEstado).toPromise();
      this.personal.update(list =>
        list.map(person =>
          person.id === p.id ? { ...person, estado: nuevoEstado } : person
        )
      );
      this.selected.update(sel => sel ? { ...sel, estado: nuevoEstado } : null);
    } catch (e) {
      console.error('Error al cambiar estado:', e);
      alert('Error al cambiar estado del personal');
    }
  }
}

// ==================== PERFIL TALLER VIEW ====================
declare const L: any;

@Component({
  selector: 'app-perfil-taller-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="flex:1;padding:1.5rem;overflow-y:auto">
  <div style="max-width:896px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">

    <!-- Loading -->
    <div *ngIf="loading()" class="card" style="padding:2rem;text-align:center">
      <p>Cargando perfil...</p>
    </div>

    <!-- Header -->
    <div class="card" style="padding:1.5rem" *ngIf="taller() as t">
      <div style="display:flex;align-items:flex-start;gap:1.5rem">
        <div style="position:relative;flex-shrink:0">
          <!-- Input file oculto para seleccionar foto -->
          <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" style="display:none" (change)="onFileSelected($event)" />
          <img [src]="nuevaFotoPreview() || tallerService.getFotoUrl(t.foto)" [alt]="t.nombre" style="width:128px;height:128px;border-radius:0.75rem;object-fit:cover" />
          <button *ngIf="editing" (click)="fileInput.click()" [disabled]="subiendoFoto()" style="position:absolute;bottom:0;right:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2563eb,#22c55e);color:white;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);transition:opacity 0.2s" [style.opacity]="subiendoFoto() ? '0.6' : '1'">
            <svg *ngIf="!subiendoFoto()" style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <svg *ngIf="subiendoFoto()" style="width:16px;height:16px;animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"/></svg>
          </button>
          <!-- Botón cancelar preview si hay nueva foto -->
          <button *ngIf="nuevaFotoPreview() && editing" (click)="cancelarCambioFoto()" style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ef4444;color:white;border:none;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);font-size:12px">×</button>
        </div>
        <div style="flex:1">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem">
            <div>
              <h1 style="margin-bottom:0.5rem">{{ t.nombre }}</h1>
              <div style="display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:#4b5563">
                <span style="display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px;color:#fbbf24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {{ t.calificacion }}</span>
                <span style="display:flex;align-items:center;gap:0.25rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> {{ t.totalServicios }} servicios</span>
              </div>
            </div>
            <button *ngIf="!editing" class="btn btn-outline" (click)="editing = true" style="display:flex;align-items:center;gap:0.5rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar Perfil</button>
          </div>
          <p class="text-gray-600">{{ t.descripcion }}</p>
        </div>
      </div>
    </div>

    <!-- Contacto -->
    <div class="card" style="padding:1.5rem" *ngIf="taller() as t">
      <h3 style="margin-bottom:1rem">Información de Contacto</h3>
      <ng-container *ngIf="!editing">
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <div *ngFor="let c of contactoItems" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:#f9fafb;border-radius:0.5rem">
            <span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px">
              <svg *ngIf="c.label === 'Ubicación'" style="width:20px;height:20px;color:#6b7280" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <svg *ngIf="c.label === 'Teléfono'" style="width:20px;height:20px;color:#6b7280" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <svg *ngIf="c.label === 'Email'" style="width:20px;height:20px;color:#6b7280" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <div><p class="text-xs text-gray-500" style="margin-bottom:0.25rem">{{ c.label }}</p><p class="text-sm text-gray-900">{{ c.value }}</p></div>
          </div>
        </div>
      </ng-container>
      <ng-container *ngIf="editing">
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div><label class="label">Nombre del Taller</label><input class="input" [ngModel]="t.nombre" (ngModelChange)="updateTaller('nombre', $event)" style="margin-top:0.25rem" /></div>
          <div>
            <label class="label">Ubicación</label>
            <div style="display:flex;gap:0.5rem;margin-top:0.25rem">
              <input class="input" [ngModel]="t.direccion" (ngModelChange)="updateTaller('direccion', $event)" style="flex:1" />
              <button class="btn btn-outline" (click)="abrirSelectorUbicacion()" style="display:flex;align-items:center;gap:0.5rem;white-space:nowrap">
                <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Elegir en mapa
              </button>
            </div>
          </div>
          <div><label class="label">Teléfono</label><input class="input" [ngModel]="t.telefono" (ngModelChange)="updateTaller('telefono', $event)" style="margin-top:0.25rem" /></div>
          <div><label class="label">Email</label><input type="email" class="input" [ngModel]="t.email" (ngModelChange)="updateTaller('email', $event)" style="margin-top:0.25rem" /></div>
          <div><label class="label">Descripción</label><textarea class="input" [ngModel]="t.descripcion" (ngModelChange)="updateTaller('descripcion', $event)" rows="3" style="margin-top:0.25rem"></textarea></div>
          <div style="display:flex;gap:0.75rem;padding-top:1rem">
            <button class="btn btn-primary" style="flex:1" (click)="guardarCambios()">Guardar Cambios</button>
            <button class="btn btn-outline" style="flex:1" (click)="editing = false">Cancelar</button>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- Estadísticas -->
    <div class="card" style="padding:1.5rem" *ngIf="taller() as t">
      <h3 style="margin-bottom:1rem">Estadísticas</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
        <div *ngFor="let s of estadisticas" style="text-align:center;padding:1rem;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border-radius:0.5rem">
          <p style="font-size:1.875rem;font-weight:600;color:#111827;margin-bottom:0.25rem;display:flex;align-items:center;justify-content:center;gap:0.25rem">
            <svg *ngIf="s.label === 'Calificación Promedio'" style="width:24px;height:24px;color:#fbbf24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {{ s.value }}
          </p>
          <p class="text-sm text-gray-600">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Configuración -->
    <div class="card" style="padding:1.5rem" *ngIf="taller()">
      <h3 style="margin-bottom:1rem">Configuración de Cuenta</h3>
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <button class="btn btn-outline" style="justify-content:flex-start;display:flex;align-items:center;gap:0.5rem" (click)="openChangePasswordModal()"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Cambiar Contraseña</button>
        <button class="btn btn-outline" style="justify-content:flex-start;display:flex;align-items:center;gap:0.5rem"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> Configurar Notificaciones</button>
        <hr class="separator" />
        <button class="btn btn-outline" style="justify-content:flex-start;color:#dc2626;display:flex;align-items:center;gap:0.5rem" (click)="state.logout()"><svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Cerrar Sesión</button>
      </div>
    </div>

    <!-- Modal Selector de Ubicación -->
    <div *ngIf="showMapaModal()" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000">
      <div style="background:white;border-radius:1rem;padding:1.5rem;width:100%;max-width:700px;margin:1rem;display:flex;flex-direction:column;gap:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <h3 style="margin:0">Seleccionar Ubicación del Taller</h3>
          <button class="btn btn-ghost btn-icon" (click)="cerrarSelectorUbicacion()">
            <svg style="width:20px;height:20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <p class="text-sm text-gray-500">Haz clic en el mapa para seleccionar la ubicación de tu taller</p>
        <div id="mapa-ubicacion-taller" style="width:100%;height:400px;border-radius:0.5rem;background:#e5e7eb"></div>
        <div *ngIf="ubicacionTemporal()" style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.75rem;border-radius:0.5rem">
          <p class="text-sm" style="color:#15803d;margin:0">
            <strong>Ubicación seleccionada:</strong> {{ ubicacionTemporal()?.direccion }}
          </p>
        </div>
        <div style="display:flex;gap:0.75rem;padding-top:0.5rem">
          <button class="btn btn-primary" style="flex:1" (click)="confirmarUbicacion()" [disabled]="!ubicacionTemporal()">
            Confirmar Ubicación
          </button>
          <button class="btn btn-outline" style="flex:1" (click)="cerrarSelectorUbicacion()">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Cambiar Contraseña -->
    <div *ngIf="showChangePasswordModal()" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000">
      <div style="background:white;border-radius:1rem;padding:1.5rem;width:100%;max-width:400px;margin:1rem">
        <h3 style="margin-bottom:1rem">Cambiar Contraseña</h3>

        <div *ngIf="changePasswordError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
          {{ changePasswordError() }}
        </div>

        <div *ngIf="changePasswordSuccess()" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
          {{ changePasswordSuccess() }}
        </div>

        <div style="display:flex;flex-direction:column;gap:1rem">
          <div>
            <label class="label">Contraseña actual</label>
            <input type="password" class="input" [(ngModel)]="currentPassword" style="margin-top:0.25rem" placeholder="••••••••" />
          </div>
          <div>
            <label class="label">Nueva contraseña</label>
            <input type="password" class="input" [(ngModel)]="newPassword" style="margin-top:0.25rem" placeholder="••••••••" />
          </div>
          <div>
            <label class="label">Confirmar nueva contraseña</label>
            <input type="password" class="input" [(ngModel)]="confirmNewPassword" style="margin-top:0.25rem" placeholder="••••••••" />
          </div>
        </div>

        <div style="display:flex;gap:0.75rem;padding-top:1.5rem">
          <button class="btn btn-primary" style="flex:1" (click)="submitChangePassword()" [disabled]="changePasswordLoading()">
            <span *ngIf="!changePasswordLoading()">Guardar</span>
            <span *ngIf="changePasswordLoading()">Guardando...</span>
          </button>
          <button class="btn btn-outline" style="flex:1" (click)="closeChangePasswordModal()">Cancelar</button>
        </div>
      </div>
    </div>

  </div>
</div>`,
  styles: [``]
})
export class PerfilTallerViewComponent implements OnInit {
  state = inject(AppStateService);
  mockData = inject(MockDataService);
  tallerService = inject(TallerService);
  authService = inject(AuthService);
  editing = false;
  loading = signal(false);

  taller = signal<Taller>({ ...this.mockData.taller });
  stats = signal<any>(null);

  // Foto de perfil
  nuevaFotoFile: File | null = null;
  nuevaFotoPreview = signal<string | null>(null);
  subiendoFoto = signal(false);

  // Modal cambiar contraseña
  showChangePasswordModal = signal(false);
  changePasswordLoading = signal(false);
  changePasswordError = signal<string | null>(null);
  changePasswordSuccess = signal<string | null>(null);
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';

  // Modal selector de ubicación
  showMapaModal = signal(false);
  mapaUbicacion: any = null;
  mapaMarker: any = null;
  ubicacionTemporal = signal<{lat: number, lng: number, direccion: string} | null>(null);

  abrirSelectorUbicacion() {
    this.showMapaModal.set(true);
    this.ubicacionTemporal.set(null);
    // Inicializar mapa después de que el DOM se actualice
    setTimeout(() => this.inicializarMapaUbicacion(), 100);
  }

  cerrarSelectorUbicacion() {
    this.showMapaModal.set(false);
    this.ubicacionTemporal.set(null);
    if (this.mapaUbicacion) {
      this.mapaUbicacion.remove();
      this.mapaUbicacion = null;
    }
  }

  confirmarUbicacion() {
    const ubicacion = this.ubicacionTemporal();
    if (ubicacion) {
      this.updateTaller('direccion', ubicacion.direccion);
      this.updateTaller('lat', ubicacion.lat);
      this.updateTaller('lng', ubicacion.lng);
      this.cerrarSelectorUbicacion();
    }
  }

  private inicializarMapaUbicacion() {
    if (typeof L === 'undefined') return;

    const container = document.getElementById('mapa-ubicacion-taller');
    if (!container) return;

    // Santa Cruz, Bolivia por defecto
    const defaultLat = -17.7833;
    const defaultLng = -63.1821;

    this.mapaUbicacion = L.map('mapa-ubicacion-taller').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapaUbicacion);

    // Manejar clic en el mapa
    this.mapaUbicacion.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;

      // Actualizar o crear marcador
      if (this.mapaMarker) {
        this.mapaMarker.setLatLng([lat, lng]);
      } else {
        this.mapaMarker = L.marker([lat, lng]).addTo(this.mapaUbicacion);
      }

      // Obtener dirección aproximada (en producción usar geocoding)
      const direccion = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      this.ubicacionTemporal.set({ lat, lng, direccion });
    });
  }

  openChangePasswordModal() {
    this.showChangePasswordModal.set(true);
    this.changePasswordError.set(null);
    this.changePasswordSuccess.set(null);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal.set(false);
  }

  async submitChangePassword() {
    this.changePasswordError.set(null);
    this.changePasswordSuccess.set(null);

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.changePasswordError.set('Por favor completa todos los campos');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.changePasswordError.set('Las contraseñas no coinciden');
      return;
    }

    if (this.newPassword.length < 6) {
      this.changePasswordError.set('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.changePasswordLoading.set(true);

    try {
      const response = await this.authService.changePassword({
        current_password: this.currentPassword,
        new_password: this.newPassword
      }).toPromise();

      if (response?.success) {
        this.changePasswordSuccess.set(response.message);
        setTimeout(() => this.closeChangePasswordModal(), 2000);
      } else {
        this.changePasswordError.set(response?.message || 'Error al cambiar contraseña');
      }
    } catch (err: any) {
      this.changePasswordError.set(err.error?.detail || 'Error de conexión');
    } finally {
      this.changePasswordLoading.set(false);
    }
  }

  ngOnInit() {
    this.cargarTaller();
  }

  async cargarTaller() {
    this.loading.set(true);
    try {
      const [tallerData, statsData] = await Promise.all([
        this.tallerService.obtener().toPromise(),
        this.tallerService.getStats().toPromise()
      ]);
      this.taller.set(tallerData ?? { ...this.mockData.taller });
      this.stats.set(statsData);
    } catch (e) {
      this.taller.set({ ...this.mockData.taller });
    } finally {
      this.loading.set(false);
    }
  }

  updateTaller(field: keyof Taller, value: any) {
    this.taller.update(t => ({ ...t, [field]: value }));
  }

  async guardarCambios() {
    try {
      // Si hay nueva foto, subirla primero
      if (this.nuevaFotoFile) {
        this.subiendoFoto.set(true);
        const fotoResponse = await this.tallerService.updateFoto(this.nuevaFotoFile).toPromise();
        if (fotoResponse?.success) {
          // Actualizar la URL de la foto en el objeto taller
          this.taller.update(t => ({ ...t, foto: fotoResponse.url }));
        }
        this.subiendoFoto.set(false);
      }

      // Guardar otros datos del taller
      await this.tallerService.actualizar({
        nombre: this.taller().nombre,
        direccion: this.taller().direccion,
        telefono: this.taller().telefono,
        email: this.taller().email,
        descripcion: this.taller().descripcion,
        foto: this.taller().foto,
        lat: this.taller().lat,
        lng: this.taller().lng
      }).toPromise();

      // Limpiar estado de foto temporal
      this.nuevaFotoFile = null;
      this.nuevaFotoPreview.set(null);
      this.editing = false;
      this.cargarTaller();
    } catch (e) {
      console.error('Error guardando:', e);
      this.subiendoFoto.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (JPEG, PNG o WEBP)');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      this.nuevaFotoFile = file;

      // Generar preview
      const reader = new FileReader();
      reader.onload = () => {
        this.nuevaFotoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  cancelarCambioFoto() {
    this.nuevaFotoFile = null;
    this.nuevaFotoPreview.set(null);
  }

  get contactoItems() {
    const t = this.taller();
    if (!t) return [];
    return [
      { icon: 'location', label: 'Ubicación', value: t.direccion || '' },
      { icon: 'phone', label: 'Teléfono', value: t.telefono || '' },
      { icon: 'email', label: 'Email', value: t.email || '' },
    ];
  }

  get estadisticas() {
    const t = this.taller();
    const s = this.stats();
    if (!t) return [];
    return [
      { value: s?.total_servicios ?? t.totalServicios ?? 0, label: 'Servicios Totales' },
      { value: s?.calificacion_promedio ?? t.calificacion ?? 0, label: 'Calificación Promedio' },
      { value: `${s?.ingresos_totales ?? 0} Bs`, label: 'Ingresos' },
    ];
  }
}

// ==================== GRUA VIEW ====================
@Component({
  selector: 'app-grua-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="flex:1;padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;overflow-y:auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <h2>Gestión de Grúas</h2>
      <p class="text-sm text-gray-500">Administra gruistas y asignación de servicios</p>
    </div>
    <div style="display:flex;gap:0.75rem">
      <button class="btn btn-primary" (click)="openCreateModal()">➕ Nuevo Gruista</button>
      <button class="btn btn-outline" (click)="cargarDatos()">🔄 Actualizar</button>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats4">
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Gruistas Disponibles</p>
      <p class="stat-val">{{ gruistasDisponibles() }}</p>
    </div>
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">En Servicio</p>
      <p class="stat-val">{{ gruistasEnServicio() }}</p>
    </div>
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Total Gruistas</p>
      <p class="stat-val">{{ gruistas().length }}</p>
    </div>
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Servicios Hoy</p>
      <p class="stat-val">{{ serviciosHoy() }}</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tabs-trigger" [class.active]="tab() === 'todos'" (click)="tab.set('todos')">Todos</button>
    <button class="tabs-trigger" [class.active]="tab() === 'disponibles'" (click)="tab.set('disponibles')">Disponibles</button>
    <button class="tabs-trigger" [class.active]="tab() === 'en-servicio'" (click)="tab.set('en-servicio')">En Servicio</button>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" style="text-align:center;padding:3rem">
    <div class="spinner"></div>
    <p class="text-sm text-gray-500" style="margin-top:1rem">Cargando gruistas...</p>
  </div>

  <!-- Grid de Gruistas -->
  <div *ngIf="!loading()" class="personal-grid">
    <div *ngFor="let g of gruistasFiltrados()" class="card pers-card">
      <div style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:1rem">
        <img [src]="g.foto" [alt]="g.nombre" style="width:64px;height:64px;border-radius:50%;object-fit:cover" />
        <div style="flex:1">
          <h3 style="margin-bottom:0.25rem">{{ g.nombre }}</h3>
          <span class="badge badge-outline">Gruista</span>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-outline btn-sm" (click)="openEditModal(g)" title="Editar">✏</button>
          <button class="btn btn-outline btn-sm" (click)="confirmDelete(g)" title="Eliminar" style="color:#dc2626">🗑</button>
        </div>
      </div>
      
      <div *ngIf="g.estado" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
        <div class="pulse-dot" [style.background]="estadoColor(g.estado)"></div>
        <span class="text-sm text-gray-700">{{ estadoLabel(g.estado) }}</span>
      </div>
      
      <div *ngIf="g.telefono" style="margin-bottom:0.75rem">
        <p class="text-xs text-gray-500" style="margin-bottom:0.25rem">📞 Teléfono</p>
        <p class="text-sm text-gray-900">{{ g.telefono }}</p>
      </div>
      
      <div *ngIf="g.estado" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;padding-top:0.75rem;border-top:1px solid #e5e7eb;margin-bottom:0.75rem">
        <div><p class="text-xs text-gray-500" style="margin-bottom:0.25rem">📅 Hoy</p><p class="text-sm text-gray-900">{{ g.asistenciasDia || 0 }}</p></div>
        <div><p class="text-xs text-gray-500" style="margin-bottom:0.25rem">📈 Mes</p><p class="text-sm text-gray-900">{{ g.asistenciasMes || 0 }}</p></div>
      </div>
      
      <div style="display:flex;gap:0.5rem">
        <button class="btn btn-outline btn-sm" style="flex:1" (click)="llamarGruista(g)">📞 Llamar</button>
        <button *ngIf="g.estado === 'disponible'" class="btn btn-primary btn-sm" style="flex:1" (click)="asignarServicio(g)">🚛 Asignar</button>
      </div>
    </div>
  </div>

  <!-- Sin resultados -->
  <div *ngIf="!loading() && gruistasFiltrados().length === 0" style="text-align:center;padding:3rem;color:#6b7280">
    <p>No hay gruistas {{ tab() !== 'todos' ? 'en esta categoría' : 'registrados' }}</p>
    <button class="btn btn-outline" style="margin-top:1rem" (click)="openCreateModal()">Crear primer gruista</button>
  </div>
</div>

<!-- Modal Formulario Crear/Editar -->
<div *ngIf="showFormModal()" class="modal-overlay" (click)="closeFormModal()">
  <div class="card" style="width:100%;max-width:500px;padding:1.5rem;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
    <h3 style="margin-bottom:1.5rem">{{ editingGruista() ? 'Editar' : 'Nuevo' }} Gruista</h3>

    <div *ngIf="formError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
      {{ formError() }}
    </div>

    <div style="display:flex;flex-direction:column;gap:1rem">
      <div>
        <label class="label">Nombre completo *</label>
        <input class="input" [(ngModel)]="formData.nombre" placeholder="Ej: Mario Sánchez" style="margin-top:0.25rem" />
      </div>

      <div>
        <label class="label">Estado</label>
        <select class="select" [(ngModel)]="formData.estado" style="margin-top:0.25rem">
          <option value="disponible">Disponible</option>
          <option value="ocupado">Ocupado</option>
          <option value="en_camino">En camino</option>
          <option value="regresando">Regresando al taller</option>
        </select>
      </div>

      <div>
        <label class="label">Teléfono *</label>
        <input class="input" [(ngModel)]="formData.telefono" placeholder="Ej: +591 7333 4444" style="margin-top:0.25rem" />
      </div>

      <div>
        <label class="label">Foto (URL)</label>
        <input class="input" [(ngModel)]="formData.foto" placeholder="https://..." style="margin-top:0.25rem" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <label class="label">Asistencias Hoy</label>
          <input type="number" class="input" [(ngModel)]="formData.asistenciasDia" style="margin-top:0.25rem" />
        </div>
        <div>
          <label class="label">Asistencias Mes</label>
          <input type="number" class="input" [(ngModel)]="formData.asistenciasMes" style="margin-top:0.25rem" />
        </div>
      </div>
    </div>

    <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
      <button class="btn btn-primary" style="flex:1" (click)="submitForm()" [disabled]="formLoading()">
        <span *ngIf="!formLoading()">{{ editingGruista() ? 'Guardar Cambios' : 'Crear Gruista' }}</span>
        <span *ngIf="formLoading()">Guardando...</span>
      </button>
      <button class="btn btn-outline" style="flex:1" (click)="closeFormModal()">Cancelar</button>
    </div>
  </div>
</div>

<!-- Modal Confirmar Eliminación -->
<div *ngIf="showDeleteModal()" class="modal-overlay" (click)="closeDeleteModal()">
  <div class="card" style="width:100%;max-width:400px;padding:1.5rem;text-align:center" (click)="$event.stopPropagation()">
    <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
    <h3 style="margin-bottom:0.5rem">¿Eliminar gruista?</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1.5rem">Esta acción no se puede deshacer. {{ gruistaToDelete()?.nombre }} será eliminado permanentemente.</p>

    <div *ngIf="deleteError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
      {{ deleteError() }}
    </div>

    <div style="display:flex;gap:0.75rem">
      <button class="btn btn-outline" style="flex:1" (click)="closeDeleteModal()">Cancelar</button>
      <button class="btn btn-primary" style="flex:1;background:#dc2626;border-color:#dc2626" (click)="deleteGruista()" [disabled]="deleteLoading()">
        <span *ngIf="!deleteLoading()">Sí, Eliminar</span>
        <span *ngIf="deleteLoading()">Eliminando...</span>
      </button>
    </div>
  </div>
</div>

<!-- Modal Asignar Servicio -->
<div *ngIf="showAsignarModal()" class="modal-overlay" (click)="closeAsignarModal()">
  <div class="card" style="width:100%;max-width:500px;padding:1.5rem" (click)="$event.stopPropagation()">
    <h3 style="margin-bottom:1rem">🚛 Asignar Servicio</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1rem">Gruista: <strong>{{ gruistaSeleccionado()?.nombre }}</strong></p>
    
    <div *ngIf="asignarError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
      {{ asignarError() }}
    </div>

    <div style="margin-bottom:1rem">
      <label class="label">Solicitud de Grúa Pendiente</label>
      <select class="select" [(ngModel)]="solicitudSeleccionadaId" style="margin-top:0.25rem">
        <option value="">Seleccionar solicitud...</option>
        <option *ngFor="let s of solicitudesPendientes()" [value]="s.id">
          {{ s.cliente?.nombre }} - {{ s.ubicacion || 'Sin ubicación' }}
        </option>
      </select>
    </div>
    
    <p *ngIf="solicitudesPendientes().length === 0" class="text-sm text-gray-500" style="margin-bottom:1rem">
      No hay solicitudes de grúa pendientes.
    </p>

    <div style="display:flex;gap:0.75rem">
      <button class="btn btn-outline" style="flex:1" (click)="closeAsignarModal()">Cancelar</button>
      <button class="btn btn-primary" style="flex:1" (click)="confirmarAsignacion()" [disabled]="!solicitudSeleccionadaId || asignarLoading()">
        <span *ngIf="!asignarLoading()">Asignar Servicio</span>
        <span *ngIf="asignarLoading()">Asignando...</span>
      </button>
    </div>
  </div>
</div>
`,
  styles: [`
.stats4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
.stat-val { font-size:1.5rem; font-weight:600; color:#111827; margin-top:0.25rem; }
.personal-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.pers-card { padding:1rem; cursor:pointer; transition:box-shadow 0.15s; }
.pers-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); }
.pulse-dot { width:12px; height:12px; border-radius:50%; animation:pulse 2s infinite; flex-shrink:0; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:2000; padding:1.5rem; }
.tabs { display:flex; gap:0.5rem; border-bottom:1px solid #e5e7eb; }
.tabs-trigger { padding:0.75rem 1rem; background:transparent; border:none; border-bottom:2px solid transparent; cursor:pointer; font-size:0.875rem; color:#6b7280; }
.tabs-trigger.active { color:#2563eb; border-bottom-color:#2563eb; }
.label { font-size:0.875rem; font-weight:500; color:#374151; }
.input { width:100%; padding:0.5rem 0.75rem; border:1px solid #d1d5db; border-radius:0.375rem; font-size:0.875rem; }
.input:focus { outline:none; border-color:#2563eb; ring:2px solid rgba(37,99,235,0.2); }
.select { width:100%; padding:0.5rem 0.75rem; border:1px solid #d1d5db; border-radius:0.375rem; font-size:0.875rem; background:white; }
@media (max-width:768px) {
  .stats4 { grid-template-columns:repeat(2,1fr); }
  .personal-grid { grid-template-columns:1fr; }
}
  `]
})
export class GruaViewComponent implements OnInit, OnDestroy {
  personalService = inject(PersonalService);
  solicitudesService = inject(SolicitudesService);
  gruaService = inject(GruaService);
  mockData = inject(MockDataService);
  
  gruistas = signal<Personal[]>([]);
  solicitudesPendientes = signal<any[]>([]);
  loading = signal(false);
  tab = signal('todos');
  
  ngOnInit() {
    this.cargarDatos();
  }
  
  ngOnDestroy() {
    // Cleanup if needed
  }
  
  async cargarDatos() {
    this.loading.set(true);
    try {
      // Cargar gruistas (personal con rol='grua')
      const data = await this.personalService.listar({ rol: 'grua' }).toPromise();
      this.gruistas.set(data ?? []);
      
      // Cargar solicitudes pendientes de grúa
      const solicitudesData = await this.solicitudesService.listar({ activas: true }).toPromise();
      const solicitudesGrua = (solicitudesData || []).filter((s: any) => 
        s.tipo === 'grua' || s.requiere_grua || 
        ['pendiente', 'aceptada', 'en_camino'].includes(s.estado)
      );
      this.solicitudesPendientes.set(solicitudesGrua);
    } catch (e) {
      console.error('Error cargando datos:', e);
      // Usar datos mock como fallback
      this.gruistas.set(this.mockData.personal.filter((p: any) => p.rol === 'grua'));
    } finally {
      this.loading.set(false);
    }
  }
  
  get gruistasFiltrados() {
    return computed(() => {
      const todos = this.gruistas();
      if (this.tab() === 'disponibles') {
        return todos.filter(g => g.estado === 'disponible');
      }
      if (this.tab() === 'en-servicio') {
        return todos.filter(g => g.estado === 'ocupado' || g.estado === 'en_camino');
      }
      return todos;
    });
  }
  
  get gruistasDisponibles() {
    return computed(() => this.gruistas().filter(g => g.estado === 'disponible').length);
  }
  
  get gruistasEnServicio() {
    return computed(() => this.gruistas().filter(g => g.estado === 'ocupado' || g.estado === 'en_camino').length);
  }
  
  get serviciosHoy() {
    return computed(() => this.gruistas().reduce((sum, g) => sum + (g.asistenciasDia || 0), 0));
  }
  
  estadoColor(e: string) { 
    return ({ disponible: '#22c55e', ocupado: '#ef4444', en_camino: '#eab308', regresando: '#06b6d4' } as any)[e] ?? '#9ca3af'; 
  }
  
  estadoLabel(e: string) { 
    return ({ disponible: 'Disponible', ocupado: 'En servicio', en_camino: 'En camino', regresando: 'Regresando al taller' } as any)[e] ?? e; 
  }
  
  // ============ CRUD Signals ============
  showFormModal = signal(false);
  showDeleteModal = signal(false);
  editingGruista = signal<Personal | null>(null);
  gruistaToDelete = signal<Personal | null>(null);
  formLoading = signal(false);
  deleteLoading = signal(false);
  formError = signal<string | null>(null);
  deleteError = signal<string | null>(null);
  
  // ============ Asignar Servicio Signals ============
  showAsignarModal = signal(false);
  gruistaSeleccionado = signal<Personal | null>(null);
  solicitudSeleccionadaId = '';
  asignarLoading = signal(false);
  asignarError = signal<string | null>(null);
  
  formData = {
    nombre: '',
    rol: 'grua' as RolPersonal,
    estado: 'disponible' as EstadoPersonal,
    telefono: '',
    foto: '',
    asistenciasDia: 0,
    asistenciasMes: 0
  };
  
  resetForm() {
    this.formData = {
      nombre: '',
      rol: 'grua',
      estado: 'disponible',
      telefono: '',
      foto: '',
      asistenciasDia: 0,
      asistenciasMes: 0
    };
  }
  
  openCreateModal() {
    this.resetForm();
    this.editingGruista.set(null);
    this.formError.set(null);
    this.showFormModal.set(true);
  }
  
  openEditModal(g: Personal) {
    this.formData = {
      nombre: g.nombre,
      rol: 'grua',
      estado: g.estado || 'disponible',
      telefono: g.telefono || '',
      foto: g.foto || '',
      asistenciasDia: g.asistenciasDia || 0,
      asistenciasMes: g.asistenciasMes || 0
    };
    this.editingGruista.set(g);
    this.formError.set(null);
    this.showFormModal.set(true);
  }
  
  closeFormModal() {
    this.showFormModal.set(false);
    this.formError.set(null);
    this.editingGruista.set(null);
  }
  
  validateForm(): boolean {
    if (!this.formData.nombre.trim()) {
      this.formError.set('El nombre es obligatorio');
      return false;
    }
    if (!this.formData.telefono.trim()) {
      this.formError.set('El teléfono es obligatorio');
      return false;
    }
    return true;
  }
  
  async submitForm() {
    if (!this.validateForm()) return;
    
    this.formLoading.set(true);
    this.formError.set(null);
    
    try {
      if (this.editingGruista()) {
        // Actualizar
        const g = this.editingGruista()!;
        await this.personalService.actualizar(g.id, {
          nombre: this.formData.nombre,
          rol: 'grua',
          estado: this.formData.estado,
          telefono: this.formData.telefono,
          foto: this.formData.foto,
          asistencias_dia: this.formData.asistenciasDia,
          asistencias_mes: this.formData.asistenciasMes
        }).toPromise();
        
        this.gruistas.update(list =>
          list.map(gruista =>
            gruista.id === g.id
              ? {
                  ...gruista,
                  nombre: this.formData.nombre,
                  rol: 'grua',
                  estado: this.formData.estado,
                  telefono: this.formData.telefono,
                  foto: this.formData.foto,
                  asistenciasDia: this.formData.asistenciasDia,
                  asistenciasMes: this.formData.asistenciasMes
                }
              : gruista
          )
        );
      } else {
        // Crear nuevo
        const nuevo = await this.personalService.crear({
          nombre: this.formData.nombre,
          rol: 'grua',
          estado: this.formData.estado,
          telefono: this.formData.telefono,
          foto: this.formData.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
          asistencias_dia: this.formData.asistenciasDia,
          asistencias_mes: this.formData.asistenciasMes
        }).toPromise();
        
        if (nuevo) {
          this.gruistas.update(list => [...list, nuevo]);
        }
      }
      
      this.closeFormModal();
    } catch (e: any) {
      console.error('Error al guardar gruista:', e);
      this.formError.set(e.error?.detail || 'Error al guardar el gruista');
    } finally {
      this.formLoading.set(false);
    }
  }
  
  confirmDelete(g: Personal) {
    this.gruistaToDelete.set(g);
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }
  
  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.gruistaToDelete.set(null);
    this.deleteError.set(null);
  }
  
  async deleteGruista() {
    const g = this.gruistaToDelete();
    if (!g) return;
    
    this.deleteLoading.set(true);
    this.deleteError.set(null);
    
    try {
      await this.personalService.eliminar(g.id).toPromise();
      this.gruistas.update(list => list.filter(gruista => gruista.id !== g.id));
      this.closeDeleteModal();
    } catch (e: any) {
      console.error('Error al eliminar gruista:', e);
      this.deleteError.set(e.error?.detail || 'Error al eliminar el gruista');
    } finally {
      this.deleteLoading.set(false);
    }
  }
  
  // ============ Asignar Servicio ============
  asignarServicio(g: Personal) {
    this.gruistaSeleccionado.set(g);
    this.asignarError.set(null);
    this.solicitudSeleccionadaId = '';
    this.showAsignarModal.set(true);
  }
  
  closeAsignarModal() {
    this.showAsignarModal.set(false);
    this.gruistaSeleccionado.set(null);
    this.solicitudSeleccionadaId = '';
    this.asignarError.set(null);
  }
  
  async confirmarAsignacion() {
    if (!this.solicitudSeleccionadaId || !this.gruistaSeleccionado()) return;
    
    this.asignarLoading.set(true);
    this.asignarError.set(null);
    
    try {
      const solicitud = this.solicitudesPendientes().find(s => s.id === this.solicitudSeleccionadaId);
      if (!solicitud) {
        this.asignarError.set('Solicitud no encontrada');
        return;
      }
      
      const lat = solicitud.cliente?.lat || -17.7856;
      const lng = solicitud.cliente?.lng || -63.1789;
      
      const response = await this.gruaService.asignarGrua(solicitud.id, lat, lng).toPromise();
      
      if (response?.success) {
        alert(`Grúa asignada exitosamente:\n${response.gruista_nombre}\nDistancia: ${response.distancia_km?.toFixed(1)} km\nTiempo estimado: ${response.tiempo_estimado_min} min`);
        this.closeAsignarModal();
        this.cargarDatos();
      } else {
        this.asignarError.set(response?.message || 'No se pudo asignar grúa');
      }
    } catch (e: any) {
      console.error('Error asignando grúa:', e);
      this.asignarError.set(e.error?.detail || 'Error al asignar grúa');
    } finally {
      this.asignarLoading.set(false);
    }
  }
  
  llamarGruista(g: Personal) {
    if (g.telefono) {
      window.open(`tel:${g.telefono}`, '_self');
    } else {
      alert('El gruista no tiene teléfono registrado');
    }
  }
}

// ==================== EVALUAR INCIDENTE VIEW (CU6) ====================
import { EvaluacionesService, Evaluacion, DiagnosticoIAResponse } from '../services/evaluaciones.service';

@Component({
  selector: 'app-evaluar-incidente-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="flex:1;padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;overflow-y:auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <h2>Evaluar Incidentes</h2>
      <p class="text-sm text-gray-500">Evalúa solicitudes y genera diagnósticos</p>
    </div>
    <div style="display:flex;gap:0.75rem">
      <button class="btn btn-outline" (click)="cargarDatos()">🔄 Actualizar</button>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats4">
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Pendientes Evaluación</p>
      <p class="stat-val">{{ solicitudesPendientes().length }}</p>
    </div>
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Evaluaciones Hoy</p>
      <p class="stat-val">{{ evaluacionesHoy() }}</p>
    </div>
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Aprobadas</p>
      <p class="stat-val">{{ evaluacionesAprobadas() }}</p>
    </div>
    <div class="card" style="padding:1rem">
      <p class="text-sm text-gray-500">Rechazadas</p>
      <p class="stat-val">{{ evaluacionesRechazadas() }}</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tabs-trigger" [class.active]="tab() === 'pendientes'" (click)="tab.set('pendientes')">Pendientes Evaluación</button>
    <button class="tabs-trigger" [class.active]="tab() === 'evaluadas'" (click)="tab.set('evaluadas')">Evaluadas</button>
    <button class="tabs-trigger" [class.active]="tab() === 'aprobadas'" (click)="tab.set('aprobadas')">Aprobadas</button>
    <button class="tabs-trigger" [class.active]="tab() === 'rechazadas'" (click)="tab.set('rechazadas')">Rechazadas</button>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" style="text-align:center;padding:3rem">
    <div class="spinner"></div>
    <p class="text-sm text-gray-500" style="margin-top:1rem">Cargando solicitudes...</p>
  </div>

  <!-- Lista de Solicitudes -->
  <div *ngIf="!loading()" style="display:flex;flex-direction:column;gap:1rem">
    <div *ngFor="let s of solicitudesFiltradas()" class="card" style="padding:1rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
        <div style="display:flex;gap:0.75rem;align-items:center">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#22c55e);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold">
            {{ s.cliente?.nombre?.[0] || '?' }}
          </div>
          <div>
            <h4 style="margin:0">{{ s.cliente?.nombre || 'Cliente' }}</h4>
            <p class="text-sm text-gray-500">{{ s.vehiculo?.marca }} {{ s.vehiculo?.modelo }} - {{ s.vehiculo?.placa }}</p>
          </div>
        </div>
        <span class="badge" [class]="'badge-' + getEstadoClass(s.estado)">{{ s.estado }}</span>
      </div>

      <div style="background:#f9fafb;padding:0.75rem;border-radius:0.5rem;margin-bottom:0.75rem">
        <p class="text-sm" style="margin:0"><strong>Problema:</strong> {{ s.problema || s.descripcion }}</p>
        <p class="text-xs text-gray-500" style="margin-top:0.5rem">{{ s.descripcion }}</p>
      </div>

      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button *ngIf="!s.evaluacion" class="btn btn-primary btn-sm" (click)="abrirEvaluacionModal(s)">
          🔍 Evaluar
        </button>
        <button *ngIf="!s.evaluacion" class="btn btn-outline btn-sm" (click)="generarDiagnosticoIA(s)" [disabled]="generandoIA() === s.id">
          <span *ngIf="generandoIA() === s.id">⏳ Generando...</span>
          <span *ngIf="generandoIA() !== s.id">✨ Diagnóstico IA</span>
        </button>
        <button *ngIf="s.evaluacion" class="btn btn-outline btn-sm" (click)="verEvaluacion(s.evaluacion)">
          👁️ Ver Evaluación
        </button>
      </div>

      <!-- Mostrar diagnóstico IA si existe -->
      <div *ngIf="s.diagnosticoIA" style="margin-top:0.75rem;padding:0.75rem;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:0.5rem">
        <h5 style="margin:0 0 0.5rem 0;color:#047857">🤖 Diagnóstico IA ({{ s.diagnosticoIA.modelo_usado }})</h5>
        <p class="text-sm" style="margin:0"><strong>Diagnóstico:</strong> {{ s.diagnosticoIA.diagnostico.diagnostico }}</p>
        <p class="text-sm" style="margin:0.25rem 0 0 0"><strong>Gravedad:</strong> <span [class]="'badge badge-' + s.diagnosticoIA.diagnostico.gravedad">{{ s.diagnosticoIA.diagnostico.gravedad }}</span></p>
        <p class="text-sm" style="margin:0.25rem 0 0 0"><strong>Tiempo estimado:</strong> {{ s.diagnosticoIA.diagnostico.tiempo_estimado_minutos }} minutos</p>
        <p class="text-sm" style="margin:0.25rem 0 0 0" *ngIf="s.diagnosticoIA.diagnostico.repuestos_sugeridos?.length"><strong>Repuestos:</strong> {{ s.diagnosticoIA.diagnostico.repuestos_sugeridos.join(', ') }}</p>
        <button class="btn btn-primary btn-sm" style="margin-top:0.5rem" (click)="usarDiagnosticoIA(s)">Usar este diagnóstico</button>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="solicitudesFiltradas().length === 0" style="text-align:center;padding:3rem">
      <p class="text-gray-500">No hay solicitudes {{ tab() }}</p>
    </div>
  </div>
</div>

<!-- Modal de Evaluación -->
<div *ngIf="showEvalModal()" class="modal-overlay" (click)="cerrarEvalModal()">
  <div class="card" style="width:100%;max-width:600px;padding:1.5rem;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
    <h3 style="margin-bottom:1rem">Evaluar Incidente</h3>

    <div *ngIf="evalError()" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:0.75rem;border-radius:0.5rem;font-size:0.875rem;margin-bottom:1rem">
      {{ evalError() }}
    </div>

    <!-- Info de la solicitud -->
    <div style="background:#f9fafb;padding:0.75rem;border-radius:0.5rem;margin-bottom:1rem">
      <p class="text-sm" style="margin:0"><strong>Cliente:</strong> {{ solicitudSeleccionada()?.cliente?.nombre }}</p>
      <p class="text-sm" style="margin:0.25rem 0 0 0"><strong>Vehículo:</strong> {{ solicitudSeleccionada()?.vehiculo?.marca }} {{ solicitudSeleccionada()?.vehiculo?.modelo }}</p>
      <p class="text-sm" style="margin:0.25rem 0 0 0"><strong>Problema:</strong> {{ solicitudSeleccionada()?.problema }}</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:1rem">
      <div>
        <label class="label">Diagnóstico *</label>
        <textarea class="input" [(ngModel)]="evalData.diagnostico" rows="3" placeholder="Describe el diagnóstico del problema..." style="margin-top:0.25rem"></textarea>
      </div>

      <div>
        <label class="label">Gravedad *</label>
        <select class="select" [(ngModel)]="evalData.gravedad" style="margin-top:0.25rem">
          <option value="baja">🟢 Baja - Mantenimiento o problema menor</option>
          <option value="media">🟡 Media - Requiere atención pronto</option>
          <option value="alta">🟠 Alta - Avería importante</option>
          <option value="critica">🔴 Crítica - Problema de seguridad</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <label class="label">Tiempo Estimado (min) *</label>
          <input class="input" type="number" [(ngModel)]="evalData.tiempo_estimado_reparacion" placeholder="Ej: 60" style="margin-top:0.25rem" />
        </div>
        <div>
          <label class="label">Costo Estimado (Bs) *</label>
          <input class="input" type="number" [(ngModel)]="evalData.costo_estimado" placeholder="Ej: 350" style="margin-top:0.25rem" />
        </div>
      </div>

      <div>
        <label class="label">Repuestos Necesarios</label>
        <input class="input" [(ngModel)]="repuestosInput" placeholder="Separados por coma: Batería, Aceite, Filtro..." style="margin-top:0.25rem" />
      </div>

      <div style="display:flex;align-items:center;gap:0.5rem">
        <input type="checkbox" id="requiereGrua" [(ngModel)]="evalData.requiere_grua" />
        <label for="requiereGrua" style="margin:0">Requiere servicio de grúa</label>
      </div>

      <div>
        <label class="label">Notas Internas</label>
        <textarea class="input" [(ngModel)]="evalData.notas_internas" rows="2" placeholder="Notas para el mecánico..." style="margin-top:0.25rem"></textarea>
      </div>
    </div>

    <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1.5rem">
      <button class="btn btn-outline" (click)="cerrarEvalModal()">Cancelar</button>
      <button class="btn btn-primary" (click)="guardarEvaluacion()" [disabled]="evalLoading()">
        <span *ngIf="evalLoading()">Guardando...</span>
        <span *ngIf="!evalLoading()">Guardar Evaluación</span>
      </button>
    </div>
  </div>
</div>

<!-- Modal Ver Evaluación -->
<div *ngIf="showVerEvalModal()" class="modal-overlay" (click)="cerrarVerEvalModal()">
  <div class="card" style="width:100%;max-width:500px;padding:1.5rem;max-height:90vh;overflow-y:auto" (click)="$event.stopPropagation()">
    <h3 style="margin-bottom:1rem">Evaluación del Incidente</h3>

    <div *ngIf="evaluacionSeleccionada()" style="display:flex;flex-direction:column;gap:0.75rem">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="badge" [class]="'badge-' + evaluacionSeleccionada().gravedad">{{ evaluacionSeleccionada().gravedad }}</span>
        <span class="text-sm text-gray-500">{{ formatFecha(evaluacionSeleccionada().fecha_evaluacion) }}</span>
      </div>

      <div style="background:#f9fafb;padding:0.75rem;border-radius:0.5rem">
        <p class="text-sm"><strong>Diagnóstico:</strong></p>
        <p class="text-sm" style="margin:0">{{ evaluacionSeleccionada().diagnostico }}</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
        <div class="card" style="padding:0.5rem">
          <p class="text-xs text-gray-500">Tiempo Estimado</p>
          <p class="font-medium">{{ evaluacionSeleccionada().tiempo_estimado_reparacion }} min</p>
        </div>
        <div class="card" style="padding:0.5rem">
          <p class="text-xs text-gray-500">Costo Estimado</p>
          <p class="font-medium">Bs. {{ evaluacionSeleccionada().costo_estimado }}</p>
        </div>
      </div>

      <div *ngIf="evaluacionSeleccionada().repuestos_necesarios?.length">
        <p class="text-sm"><strong>Repuestos:</strong></p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          <span *ngFor="let r of evaluacionSeleccionada().repuestos_necesarios" class="badge badge-outline">{{ r }}</span>
        </div>
      </div>

      <div *ngIf="evaluacionSeleccionada().requiere_grua" style="display:flex;align-items:center;gap:0.5rem;color:#dc2626">
        <span>🚛</span>
        <span class="text-sm font-medium">Requiere grúa</span>
      </div>

      <div *ngIf="evaluacionSeleccionada().notas_internas" style="background:#fef3c7;padding:0.75rem;border-radius:0.5rem">
        <p class="text-sm" style="margin:0"><strong>📝 Notas:</strong> {{ evaluacionSeleccionada().notas_internas }}</p>
      </div>

      <div style="display:flex;gap:0.75rem;margin-top:1rem">
        <button *ngIf="evaluacionSeleccionada().estado === 'pendiente'" class="btn btn-primary" style="flex:1" (click)="aprobarEvaluacion(evaluacionSeleccionada().id)" [disabled]="accionLoading()">
          {{ accionLoading() ? 'Procesando...' : '✓ Aprobar' }}
        </button>
        <button *ngIf="evaluacionSeleccionada().estado === 'pendiente'" class="btn btn-outline" style="flex:1;color:#dc2626" (click)="rechazarEvaluacion(evaluacionSeleccionada().id)" [disabled]="accionLoading()">
          {{ accionLoading() ? 'Procesando...' : '✗ Rechazar' }}
        </button>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:1rem">
      <button class="btn btn-outline" (click)="cerrarVerEvalModal()">Cerrar</button>
    </div>
  </div>
</div>
`,
  styles: [`
    .badge-baja { background:#dcfce7;color:#166534; }
    .badge-media { background:#fef9c3;color:#854d0e; }
    .badge-alta { background:#ffedd5;color:#9a3412; }
    .badge-critica { background:#fee2e2;color:#991b1b; }
    .badge-pendiente { background:#f3f4f6;color:#374151; }
    .badge-evaluada { background:#dbeafe;color:#1e40af; }
    .badge-aprobada { background:#dcfce7;color:#166534; }
    .badge-rechazada { background:#fee2e2;color:#991b1b; }
  `]
})
export class EvaluarIncidenteViewComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private evaluacionesService = inject(EvaluacionesService);
  private personalService = inject(PersonalService);

  // Signals
  solicitudes = signal<Solicitud[]>([]);
  evaluaciones = signal<Evaluacion[]>([]);
  loading = signal(false);
  tab = signal<'pendientes' | 'evaluadas' | 'aprobadas' | 'rechazadas'>('pendientes');

  // Modal states
  showEvalModal = signal(false);
  showVerEvalModal = signal(false);
  evalError = signal<string | null>(null);
  evalLoading = signal(false);
  accionLoading = signal(false);
  generandoIA = signal<string | null>(null);

  solicitudSeleccionada = signal<Solicitud | null>(null);
  evaluacionSeleccionada = signal<Evaluacion | null>(null);

  // Form data
  evalData = {
    diagnostico: '',
    gravedad: 'media',
    tiempo_estimado_reparacion: 60,
    costo_estimado: 0,
    repuestos_necesarios: [] as string[],
    requiere_grua: false,
    notas_internas: ''
  };
  repuestosInput = '';
  currentUserId = 'current-user'; // TODO: Get from auth service

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.loading.set(true);
    try {
      // Cargar solicitudes pendientes y evaluaciones
      const [solicitudesRes, evaluacionesRes] = await Promise.all([
        this.solicitudesService.listar({ pendientes: true }).toPromise(),
        this.evaluacionesService.listar().toPromise()
      ]);

      const solicitudes = solicitudesRes || [];
      const evaluaciones = evaluacionesRes || [];

      // Enriquecer solicitudes con sus evaluaciones
      const solicitudesEnriquecidas = solicitudes.map(s => {
        const evaluacion = evaluaciones.find(e => e.solicitud_id === s.id);
        return { ...s, evaluacion };
      });

      this.solicitudes.set(solicitudesEnriquecidas);
      this.evaluaciones.set(evaluaciones);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      this.loading.set(false);
    }
  }

  solicitudesFiltradas() {
    const evaluaciones = this.evaluaciones();

    switch (this.tab()) {
      case 'pendientes':
        return this.solicitudes().filter(s => !evaluaciones.find(e => e.solicitud_id === s.id));
      case 'evaluadas':
        return this.solicitudes().filter(s => {
          const e = evaluaciones.find(ev => ev.solicitud_id === s.id);
          return e && e.estado === 'pendiente';
        });
      case 'aprobadas':
        return this.solicitudes().filter(s => {
          const e = evaluaciones.find(ev => ev.solicitud_id === s.id);
          return e && e.estado === 'aprobada';
        });
      case 'rechazadas':
        return this.solicitudes().filter(s => {
          const e = evaluaciones.find(ev => ev.solicitud_id === s.id);
          return e && e.estado === 'rechazada';
        });
      default:
        return this.solicitudes();
    }
  }

  solicitudesPendientes() {
    const evaluaciones = this.evaluaciones();
    return this.solicitudes().filter(s => !evaluaciones.find(e => e.solicitud_id === s.id));
  }

  evaluacionesHoy() {
    const hoy = new Date().toDateString();
    return this.evaluaciones().filter(e => new Date(e.fecha_evaluacion).toDateString() === hoy).length;
  }

  evaluacionesAprobadas() {
    return this.evaluaciones().filter(e => e.estado === 'aprobada').length;
  }

  evaluacionesRechazadas() {
    return this.evaluaciones().filter(e => e.estado === 'rechazada').length;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'pendiente': 'pending',
      'aceptada': 'accepted',
      'en_camino': 'in-progress',
      'reparando': 'in-progress',
      'finalizada': 'completed',
      'rechazada': 'rejected'
    };
    return map[estado] || 'pending';
  }

  abrirEvaluacionModal(solicitud: Solicitud) {
    this.solicitudSeleccionada.set(solicitud);
    this.evalData = {
      diagnostico: '',
      gravedad: 'media',
      tiempo_estimado_reparacion: 60,
      costo_estimado: 0,
      repuestos_necesarios: [],
      requiere_grua: false,
      notas_internas: ''
    };
    this.repuestosInput = '';
    this.evalError.set(null);
    this.showEvalModal.set(true);
  }

  cerrarEvalModal() {
    this.showEvalModal.set(false);
    this.solicitudSeleccionada.set(null);
    this.evalError.set(null);
  }

  async guardarEvaluacion() {
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return;

    // Validar
    if (!this.evalData.diagnostico) {
      this.evalError.set('El diagnóstico es requerido');
      return;
    }
    if (!this.evalData.tiempo_estimado_reparacion || this.evalData.tiempo_estimado_reparacion <= 0) {
      this.evalError.set('El tiempo estimado debe ser mayor a 0');
      return;
    }

    this.evalLoading.set(true);
    this.evalError.set(null);

    try {
      // Parsear repuestos
      const repuestos = this.repuestosInput
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      const evaluacionData = {
        solicitud_id: solicitud.id,
        diagnostico: this.evalData.diagnostico,
        gravedad: this.evalData.gravedad,
        tiempo_estimado_reparacion: this.evalData.tiempo_estimado_reparacion,
        costo_estimado: this.evalData.costo_estimado,
        repuestos_necesarios: repuestos,
        requiere_grua: this.evalData.requiere_grua,
        notas_internas: this.evalData.notas_internas,
        evaluador_id: this.currentUserId
      };

      await this.evaluacionesService.crear(evaluacionData).toPromise();
      this.cerrarEvalModal();
      this.cargarDatos();
    } catch (e: any) {
      console.error('Error guardando evaluación:', e);
      this.evalError.set(e.error?.detail || 'Error al guardar la evaluación');
    } finally {
      this.evalLoading.set(false);
    }
  }

  async generarDiagnosticoIA(solicitud: Solicitud) {
    this.generandoIA.set(solicitud.id);
    try {
      const resultado = await this.evaluacionesService.generarDiagnosticoIA(solicitud.id).toPromise();
      if (resultado) {
        // Agregar diagnóstico a la solicitud
        const solicitudes = this.solicitudes();
        const idx = solicitudes.findIndex(s => s.id === solicitud.id);
        if (idx >= 0) {
          solicitudes[idx] = { ...solicitudes[idx], diagnosticoIA: resultado };
          this.solicitudes.set([...solicitudes]);
        }
      }
    } catch (e: any) {
      console.error('Error generando diagnóstico IA:', e);
      alert('Error al generar diagnóstico IA: ' + (e.error?.detail || e.message));
    } finally {
      this.generandoIA.set(null);
    }
  }

  usarDiagnosticoIA(solicitud: Solicitud) {
    const diagnostico = solicitud.diagnosticoIA?.diagnostico;
    if (!diagnostico) return;

    this.abrirEvaluacionModal(solicitud);
    this.evalData.diagnostico = diagnostico.diagnostico;
    this.evalData.gravedad = diagnostico.gravedad;
    this.evalData.tiempo_estimado_reparacion = diagnostico.tiempo_estimado_minutos;
    this.repuestosInput = diagnostico.repuestos_sugeridos?.join(', ') || '';
    this.evalData.requiere_grua = diagnostico.requiere_grua;
    this.evalData.notas_internas = diagnostico.notas_tecnico;
  }

  verEvaluacion(evaluacion: Evaluacion) {
    this.evaluacionSeleccionada.set(evaluacion);
    this.showVerEvalModal.set(true);
  }

  cerrarVerEvalModal() {
    this.showVerEvalModal.set(false);
    this.evaluacionSeleccionada.set(null);
  }

  async aprobarEvaluacion(evaluacionId: string) {
    this.accionLoading.set(true);
    try {
      await this.evaluacionesService.aprobar(evaluacionId).toPromise();
      this.cerrarVerEvalModal();
      this.cargarDatos();
    } catch (e: any) {
      console.error('Error aprobando evaluación:', e);
      alert('Error: ' + (e.error?.detail || e.message));
    } finally {
      this.accionLoading.set(false);
    }
  }

  async rechazarEvaluacion(evaluacionId: string) {
    this.accionLoading.set(true);
    try {
      await this.evaluacionesService.rechazar(evaluacionId).toPromise();
      this.cerrarVerEvalModal();
      this.cargarDatos();
    } catch (e: any) {
      console.error('Error rechazando evaluación:', e);
      alert('Error: ' + (e.error?.detail || e.message));
    } finally {
      this.accionLoading.set(false);
    }
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Extend Solicitud type to include evaluation and IA diagnosis
declare module '../models/types.model' {
  interface Solicitud {
    evaluacion?: Evaluacion;
    diagnosticoIA?: DiagnosticoIAResponse;
  }
}

// ==================== REPORTES VIEW (CU14) ====================
import { ReportesService, DashboardData, ReporteSolicitudes, ReportePagos, ReportePersonal, ReporteClientes } from '../services/reportes.service';

@Component({
  selector: 'app-reportes-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="flex:1;padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;overflow-y:auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div>
      <h2>📊 Reportes y Estadísticas</h2>
      <p class="text-sm text-gray-500">Análisis completo del taller</p>
    </div>
    <button class="btn btn-outline" (click)="cargarDashboard()">🔄 Actualizar</button>
  </div>

  <!-- Dashboard Cards -->
  <div *ngIf="dashboard()" class="stats4">
    <div class="card" style="padding:1rem;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white">
      <p class="text-sm" style="opacity:0.9">Solicitudes Hoy</p>
      <p style="font-size:2rem;font-weight:bold;margin:0">{{ dashboard()?.solicitudes?.hoy }}</p>
      <p class="text-sm" style="opacity:0.9">{{ dashboard()?.solicitudes?.mes }} este mes</p>
    </div>
    <div class="card" style="padding:1rem;background:linear-gradient(135deg,#22c55e,#15803d);color:white">
      <p class="text-sm" style="opacity:0.9">Ingresos Hoy</p>
      <p style="font-size:2rem;font-weight:bold;margin:0">Bs. {{ dashboard()?.finanzas?.ingresos_hoy | number:'1.0-0' }}</p>
      <p class="text-sm" style="opacity:0.9">Bs. {{ dashboard()?.finanzas?.ingresos_mes | number:'1.0-0' }} este mes</p>
    </div>
    <div class="card" style="padding:1rem;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white">
      <p class="text-sm" style="opacity:0.9">Personal Activo</p>
      <p style="font-size:2rem;font-weight:bold;margin:0">{{ dashboard()?.personal?.disponibles }}</p>
      <p class="text-sm" style="opacity:0.9">de {{ dashboard()?.personal?.total }} total</p>
    </div>
    <div class="card" style="padding:1rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:white">
      <p class="text-sm" style="opacity:0.9">Clientes</p>
      <p style="font-size:2rem;font-weight:bold;margin:0">{{ dashboard()?.clientes?.total }}</p>
      <p class="text-sm" style="opacity:0.9">registrados</p>
    </div>
  </div>

  <!-- Tabs de Reportes -->
  <div class="tabs">
    <button class="tabs-trigger" [class.active]="reporteTab() === 'solicitudes'" (click)="cambiarTab('solicitudes')">📋 Solicitudes</button>
    <button class="tabs-trigger" [class.active]="reporteTab() === 'finanzas'" (click)="cambiarTab('finanzas')">💰 Finanzas</button>
    <button class="tabs-trigger" [class.active]="reporteTab() === 'personal'" (click)="cambiarTab('personal')">👥 Personal</button>
    <button class="tabs-trigger" [class.active]="reporteTab() === 'clientes'" (click)="cambiarTab('clientes')">🧑‍💼 Clientes</button>
  </div>

  <!-- Filtros -->
  <div class="card" style="padding:1rem">
    <div style="display:flex;gap:1rem;align-items:end;flex-wrap:wrap">
      <div>
        <label class="label">Fecha Inicio</label>
        <input class="input" type="date" [(ngModel)]="filtros.fecha_inicio" style="margin-top:0.25rem" />
      </div>
      <div>
        <label class="label">Fecha Fin</label>
        <input class="input" type="date" [(ngModel)]="filtros.fecha_fin" style="margin-top:0.25rem" />
      </div>
      <div *ngIf="reporteTab() === 'solicitudes'">
        <label class="label">Estado</label>
        <select class="select" [(ngModel)]="filtros.estado" style="margin-top:0.25rem">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aceptada">Aceptada</option>
          <option value="finalizada">Finalizada</option>
          <option value="rechazada">Rechazada</option>
        </select>
      </div>
      <button class="btn btn-primary" (click)="generarReporte()" [disabled]="loading()">
        {{ loading() ? 'Generando...' : 'Generar Reporte' }}
      </button>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" style="text-align:center;padding:3rem">
    <div class="spinner"></div>
    <p class="text-sm text-gray-500" style="margin-top:1rem">Generando reporte...</p>
  </div>

  <!-- Reporte de Solicitudes -->
  <div *ngIf="!loading() && reporteTab() === 'solicitudes' && reporteSolicitudes()" class="card" style="padding:1.5rem">
    <h3 style="margin-bottom:1rem">Reporte de Solicitudes</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1rem">Período: {{ reporteSolicitudes()?.periodo }}</p>

    <div class="stats4" style="margin-bottom:1.5rem">
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#3b82f6">{{ reporteSolicitudes()?.total_registros }}</p>
        <p class="text-sm text-gray-500">Total Solicitudes</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#22c55e">Bs. {{ reporteSolicitudes()?.datos?.total_ingresos | number:'1.0-0' }}</p>
        <p class="text-sm text-gray-500">Ingresos Totales</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#a855f7">{{ reporteSolicitudes()?.datos?.promedio_distancia | number:'1.1-1' }} km</p>
        <p class="text-sm text-gray-500">Distancia Promedio</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#f59e0b">{{ reporteSolicitudes()?.datos?.requirieron_repuestos }}</p>
        <p class="text-sm text-gray-500">Con Repuestos</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <h4 style="margin-bottom:0.75rem">Por Estado</h4>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <div *ngFor="let item of getEstadosSolicitudes()" style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#f9fafb;border-radius:0.375rem">
            <span class="text-sm">{{ item.key }}</span>
            <span class="font-medium">{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div>
        <h4 style="margin-bottom:0.75rem">Por Problema</h4>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <div *ngFor="let item of getProblemasSolicitudes()" style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#f9fafb;border-radius:0.375rem">
            <span class="text-sm">{{ item.key }}</span>
            <span class="font-medium">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reporte de Finanzas -->
  <div *ngIf="!loading() && reporteTab() === 'finanzas' && reportePagos()" class="card" style="padding:1.5rem">
    <h3 style="margin-bottom:1rem">Reporte de Finanzas</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1rem">Período: {{ reportePagos()?.periodo }}</p>

    <div class="stats4" style="margin-bottom:1.5rem">
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#3b82f6">{{ reportePagos()?.total_registros }}</p>
        <p class="text-sm text-gray-500">Total Facturas</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#22c55e">Bs. {{ reportePagos()?.datos?.total_monto | number:'1.0-0' }}</p>
        <p class="text-sm text-gray-500">Monto Total</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#a855f7">Bs. {{ reportePagos()?.datos?.total_comisiones | number:'1.0-0' }}</p>
        <p class="text-sm text-gray-500">Comisiones</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#f59e0b">Bs. {{ reportePagos()?.datos?.promedio_monto | number:'1.0-0' }}</p>
        <p class="text-sm text-gray-500">Promedio</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <h4 style="margin-bottom:0.75rem">Por Método de Pago</h4>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <div *ngFor="let item of getMetodosPago()" style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#f9fafb;border-radius:0.375rem">
            <span class="text-sm capitalize">{{ item.key }}</span>
            <span class="font-medium">{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div>
        <h4 style="margin-bottom:0.75rem">Estado de Facturas</h4>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#dcfce7;border-radius:0.375rem">
            <span class="text-sm">✓ Enviadas</span>
            <span class="font-medium" style="color:#166534">{{ reportePagos()?.datos?.facturas_enviadas }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#fee2e2;border-radius:0.375rem">
            <span class="text-sm">⏳ Pendientes</span>
            <span class="font-medium" style="color:#991b1b">{{ reportePagos()?.datos?.facturas_pendientes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reporte de Personal -->
  <div *ngIf="!loading() && reporteTab() === 'personal' && reportePersonal()" class="card" style="padding:1.5rem">
    <h3 style="margin-bottom:1rem">Reporte de Personal</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1rem">Período: {{ reportePersonal()?.periodo }}</p>

    <div class="stats4" style="margin-bottom:1.5rem">
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#3b82f6">{{ reportePersonal()?.total_registros }}</p>
        <p class="text-sm text-gray-500">Total Personal</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#22c55e">{{ reportePersonal()?.datos?.personal_activo }}</p>
        <p class="text-sm text-gray-500">Disponibles</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#a855f7">{{ reportePersonal()?.datos?.total_asistencias_dia }}</p>
        <p class="text-sm text-gray-500">Asistencias Hoy</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#f59e0b">{{ reportePersonal()?.datos?.total_asistencias_mes }}</p>
        <p class="text-sm text-gray-500">Asistencias Mes</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
      <div>
        <h4 style="margin-bottom:0.75rem">Por Rol</h4>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <div *ngFor="let item of getRolesPersonal()" style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#f9fafb;border-radius:0.375rem">
            <span class="text-sm capitalize">{{ item.key }}</span>
            <span class="font-medium">{{ item.value }}</span>
          </div>
        </div>
      </div>
      <div>
        <h4 style="margin-bottom:0.75rem">Por Estado</h4>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <div *ngFor="let item of getEstadosPersonal()" style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:#f9fafb;border-radius:0.375rem">
            <span class="text-sm capitalize">{{ item.key }}</span>
            <span class="font-medium">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Personal -->
    <h4 style="margin-bottom:0.75rem">Detalle del Personal</h4>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:0.75rem;text-align:left;font-size:0.875rem;font-weight:600">Nombre</th>
            <th style="padding:0.75rem;text-align:left;font-size:0.875rem;font-weight:600">Rol</th>
            <th style="padding:0.75rem;text-align:center;font-size:0.875rem;font-weight:600">Estado</th>
            <th style="padding:0.75rem;text-align:center;font-size:0.875rem;font-weight:600">Hoy</th>
            <th style="padding:0.75rem;text-align:center;font-size:0.875rem;font-weight:600">Mes</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of reportePersonal()?.datos?.detalle_personal" style="border-bottom:1px solid #e5e7eb">
            <td style="padding:0.75rem">{{ p.nombre }}</td>
            <td style="padding:0.75rem"><span class="badge badge-outline capitalize">{{ p.rol }}</span></td>
            <td style="padding:0.75rem;text-align:center"><span class="badge" [class]="'badge-' + p.estado">{{ p.estado }}</span></td>
            <td style="padding:0.75rem;text-align:center">{{ p.asistencias_dia }}</td>
            <td style="padding:0.75rem;text-align:center">{{ p.asistencias_mes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Reporte de Clientes -->
  <div *ngIf="!loading() && reporteTab() === 'clientes' && reporteClientes()" class="card" style="padding:1.5rem">
    <h3 style="margin-bottom:1rem">Reporte de Clientes</h3>
    <p class="text-sm text-gray-500" style="margin-bottom:1rem">Período: {{ reporteClientes()?.periodo }}</p>

    <div class="stats4" style="margin-bottom:1.5rem">
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#3b82f6">{{ reporteClientes()?.datos?.total_clientes }}</p>
        <p class="text-sm text-gray-500">Total Clientes</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#22c55e">{{ reporteClientes()?.datos?.nuevos_en_periodo }}</p>
        <p class="text-sm text-gray-500">Nuevos</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#a855f7">{{ reporteClientes()?.datos?.clientes_recurrentes }}</p>
        <p class="text-sm text-gray-500">Recurrentes</p>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <p class="text-2xl font-bold" style="color:#f59e0b">{{ reporteClientes()?.datos?.calificacion_promedio_general | number:'1.1-1' }}</p>
        <p class="text-sm text-gray-500">Calificación</p>
      </div>
    </div>

    <div style="background:#f9fafb;padding:1rem;border-radius:0.5rem">
      <h4 style="margin-bottom:0.75rem">Métricas Adicionales</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>
          <p class="text-sm text-gray-500">Promedio de servicios por cliente</p>
          <p class="font-medium">{{ reporteClientes()?.datos?.promedio_servicios_por_cliente | number:'1.1-1' }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Clientes con calificación</p>
          <p class="font-medium">{{ reporteClientes()?.datos?.clientes_con_calificacion }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div *ngIf="!loading() && !tieneReporteActual()" style="text-align:center;padding:3rem">
    <p class="text-gray-500">Selecciona un tipo de reporte y haz clic en "Generar Reporte"</p>
  </div>
</div>
`,
  styles: [`
    .capitalize { text-transform: capitalize; }
    .badge-disponible { background:#dcfce7;color:#166534; }
    .badge-ocupado { background:#fee2e2;color:#991b1b; }
    .badge-en_camino { background:#dbeafe;color:#1e40af; }
    .badge-regresando { background:#fef3c7;color:#92400e; }
  `]
})
export class ReportesViewComponent implements OnInit {
  private reportesService = inject(ReportesService);

  // Signals
  dashboard = signal<DashboardData | null>(null);
  loading = signal(false);
  reporteTab = signal<'solicitudes' | 'finanzas' | 'personal' | 'clientes'>('solicitudes');

  // Reportes
  reporteSolicitudes = signal<ReporteSolicitudes | null>(null);
  reportePagos = signal<ReportePagos | null>(null);
  reportePersonal = signal<ReportePersonal | null>(null);
  reporteClientes = signal<ReporteClientes | null>(null);

  // Filtros
  filtros = {
    fecha_inicio: this.getFechaDefaultInicio(),
    fecha_fin: this.getFechaDefaultFin(),
    estado: ''
  };

  ngOnInit() {
    this.cargarDashboard();
    this.generarReporte();
  }

  getFechaDefaultInicio(): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  }

  getFechaDefaultFin(): string {
    return new Date().toISOString().split('T')[0];
  }

  async cargarDashboard() {
    try {
      const data = await this.reportesService.getDashboard().toPromise();
      this.dashboard.set(data || null);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    }
  }

  cambiarTab(tab: 'solicitudes' | 'finanzas' | 'personal' | 'clientes') {
    this.reporteTab.set(tab);
    this.limpiarReporteActual();
    this.generarReporte();
  }

  limpiarReporteActual() {
    this.reporteSolicitudes.set(null);
    this.reportePagos.set(null);
    this.reportePersonal.set(null);
    this.reporteClientes.set(null);
  }

  tieneReporteActual(): boolean {
    switch (this.reporteTab()) {
      case 'solicitudes': return !!this.reporteSolicitudes();
      case 'finanzas': return !!this.reportePagos();
      case 'personal': return !!this.reportePersonal();
      case 'clientes': return !!this.reporteClientes();
      default: return false;
    }
  }

  async generarReporte() {
    this.loading.set(true);
    this.limpiarReporteActual();

    try {
      const filtros = {
        fecha_inicio: this.filtros.fecha_inicio,
        fecha_fin: this.filtros.fecha_fin,
        estado: this.filtros.estado || undefined
      };

      switch (this.reporteTab()) {
        case 'solicitudes':
          const rs = await this.reportesService.getReporteSolicitudes(filtros).toPromise();
          this.reporteSolicitudes.set(rs || null);
          break;
        case 'finanzas':
          const rp = await this.reportesService.getReportePagos(filtros).toPromise();
          this.reportePagos.set(rp || null);
          break;
        case 'personal':
          const rper = await this.reportesService.getReportePersonal(filtros).toPromise();
          this.reportePersonal.set(rper || null);
          break;
        case 'clientes':
          const rc = await this.reportesService.getReporteClientes(filtros).toPromise();
          this.reporteClientes.set(rc || null);
          break;
      }
    } catch (e) {
      console.error('Error generando reporte:', e);
    } finally {
      this.loading.set(false);
    }
  }

  // Helper methods para templates
  getEstadosSolicitudes(): { key: string; value: number }[] {
    const datos = this.reporteSolicitudes()?.datos?.por_estado;
    return datos ? Object.entries(datos).map(([key, value]) => ({ key, value })) : [];
  }

  getProblemasSolicitudes(): { key: string; value: number }[] {
    const datos = this.reporteSolicitudes()?.datos?.por_problema;
    return datos ? Object.entries(datos).map(([key, value]) => ({ key, value })) : [];
  }

  getMetodosPago(): { key: string; value: number }[] {
    const datos = this.reportePagos()?.datos?.por_metodo;
    return datos ? Object.entries(datos).map(([key, value]) => ({ key, value })) : [];
  }

  getRolesPersonal(): { key: string; value: number }[] {
    const datos = this.reportePersonal()?.datos?.por_rol;
    return datos ? Object.entries(datos).map(([key, value]) => ({ key, value })) : [];
  }

  getEstadosPersonal(): { key: string; value: number }[] {
    const datos = this.reportePersonal()?.datos?.por_estado;
    return datos ? Object.entries(datos).map(([key, value]) => ({ key, value })) : [];
  }
}
