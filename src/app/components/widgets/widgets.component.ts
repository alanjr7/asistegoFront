import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../services/app-state.service';
import { MockDataService } from '../../services/mock-data.service';
import { ChatService } from '../../services/chat.service';
import { Calificacion } from '../../models/types.model';

// ==================== IA WIDGET ====================
@Component({
  selector: 'app-ia-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="ia-widget">
  <div *ngIf="open()" class="ia-panel card">
    <div class="ia-header">
      <div style="display:flex;align-items:center;gap:0.5rem">
        <div class="ia-dot"></div>
        <span class="font-medium text-gray-900" style="font-size:0.875rem">Asistente IA</span>
      </div>
      <button class="ia-close" (click)="open.set(false)">✕</button>
    </div>
    <div class="ia-messages">
      <div *ngFor="let m of messages()" class="ia-msg" [class.ia-msg-user]="m.role === 'user'">
        <p class="text-sm" style="white-space:pre-wrap">{{ m.content }}</p>
      </div>
    </div>
    <div class="ia-input">
      <input class="input" [(ngModel)]="query" placeholder="Pregunta al asistente..." (keydown.enter)="send()" style="font-size:0.875rem" [disabled]="loading()" />
      <button class="btn btn-primary btn-icon" (click)="send()" [disabled]="loading()">
        <svg *ngIf="!loading()" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        <svg *ngIf="loading()" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      </button>
    </div>
  </div>
  <button class="ia-fab bg-gradient-to-br from-blue-600 to-green-500" (click)="open.set(!open())" title="Asistente IA">
    <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </button>
</div>`,
  styles: [`
.ia-widget { position:fixed; bottom:1.5rem; right:1.5rem; z-index:500; display:flex; flex-direction:column; align-items:flex-end; gap:0.75rem; }
.ia-fab { width:56px; height:56px; border-radius:50%; border:none; cursor:pointer; font-size:1.5rem; box-shadow:0 8px 25px rgba(37,99,235,0.4); transition:transform 0.15s; display:flex; align-items:center; justify-content:center; }
.ia-fab:hover { transform:scale(1.05); }
.ia-panel { width:320px; overflow:hidden; box-shadow:0 16px 48px rgba(0,0,0,0.15); }
.ia-header { padding:0.75rem 1rem; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; }
.ia-dot { width:8px; height:8px; background:#22c55e; border-radius:50%; animation:pulse 2s infinite; }
.ia-close { background:none; border:none; cursor:pointer; color:#6b7280; font-size:1rem; padding:0.25rem; border-radius:0.25rem; }
.ia-close:hover { background:#f3f4f6; }
.ia-messages { padding:0.75rem; display:flex; flex-direction:column; gap:0.5rem; max-height:240px; overflow-y:auto; }
.ia-msg { background:#f3f4f6; padding:0.5rem 0.75rem; border-radius:0.5rem; }
.ia-msg-user { background:linear-gradient(to right,#2563eb,#22c55e); color:white; align-self:flex-end; }
.ia-input { padding:0.75rem; border-top:1px solid #e5e7eb; display:flex; gap:0.5rem; }
  `]
})
export class IAWidgetComponent {
  state = inject(AppStateService);
  chatService = inject(ChatService);
  open = signal(false);
  query = '';
  loading = signal(false);
  messages = signal<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: '¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte?' }
  ]);

  async send() {
    if (!this.query.trim() || this.loading()) return;
    
    const q = this.query;
    this.query = '';
    this.loading.set(true);
    this.messages.update(m => [...m, { role: 'user', content: q }]);
    
    try {
      const response = await this.chatService.consultarIA(q).toPromise();
      this.messages.update(m => [...m, { role: 'ai', content: response?.respuesta || 'Lo siento, no pude procesar tu consulta.' }]);
    } catch (err: any) {
      const errorMsg = err.error?.detail || 'Error al consultar la IA. Por favor, intenta de nuevo.';
      this.messages.update(m => [...m, { role: 'ai', content: `Error: ${errorMsg}` }]);
    } finally {
      this.loading.set(false);
    }
  }
}

// ==================== CALIFICACION MODAL ====================
@Component({
  selector: 'app-calificacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="modal-overlay" (click)="state.cerrarCalificacion()">
  <div class="card modal-card" (click)="$event.stopPropagation()">
    <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem">
      <div>
        <h3>Solicitar Calificación</h3>
        <p class="text-sm text-gray-500" style="margin-top:0.25rem">
          Enviar solicitud de calificación a {{ state.servicioParaCalificar()?.cliente?.nombre }}
        </p>
      </div>

      <!-- Estrellas -->
      <div>
        <label class="label" style="margin-bottom:0.5rem">Tu calificación al cliente</label>
        <div style="display:flex;gap:0.5rem">
          <button *ngFor="let i of [1,2,3,4,5]" (click)="estrellas.set(i)"
            style="background:none;border:none;cursor:pointer;font-size:2rem;transition:transform 0.1s"
            [style.transform]="i <= estrellas() ? 'scale(1.15)' : 'scale(1)'">
            <svg *ngIf="i <= estrellas()" class="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <svg *ngIf="i > estrellas()" class="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </button>
        </div>
      </div>

      <!-- Comentarios predefinidos -->
      <div>
        <label class="label" style="margin-bottom:0.5rem">Comentarios</label>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          <button *ngFor="let c of comentariosOpciones" class="btn btn-sm"
            [class.btn-primary]="comentariosSeleccionados.includes(c)"
            [class.btn-outline]="!comentariosSeleccionados.includes(c)"
            (click)="toggleComentario(c)">{{ c }}</button>
        </div>
      </div>

      <hr class="separator" />

      <div style="display:flex;gap:0.75rem">
        <button class="btn btn-outline" style="flex:1" (click)="state.cerrarCalificacion()">Cancelar</button>
        <button class="btn btn-primary flex items-center justify-center gap-2" style="flex:1" (click)="enviar()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> Enviar Solicitud
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:3000; padding:1.5rem; }
.modal-card { width:100%; max-width:448px; }
  `]
})
export class CalificacionModalComponent {
  state = inject(AppStateService);
  estrellas = signal(5);
  comentariosSeleccionados: string[] = [];
  comentariosOpciones = ['Puntual', 'Buen trato', 'Trabajo limpio', 'Precio justo', 'Recomendable', 'Profesional'];

  toggleComentario(c: string) {
    if (this.comentariosSeleccionados.includes(c)) {
      this.comentariosSeleccionados = this.comentariosSeleccionados.filter(x => x !== c);
    } else {
      this.comentariosSeleccionados.push(c);
    }
  }

  enviar() {
    const cal: Calificacion = {
      id: Date.now().toString(),
      servicioId: this.state.servicioParaCalificar()?.id ?? '',
      clienteId: this.state.servicioParaCalificar()?.cliente?.id ?? '',
      estrellas: this.estrellas(),
      comentarios: [...this.comentariosSeleccionados],
      timestamp: new Date(),
    };
    this.state.enviarCalificacion(cal);
  }
}
