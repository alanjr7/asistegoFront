import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../services/app-state.service';
import { MockDataService } from '../../services/mock-data.service';
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
      <input class="input" [(ngModel)]="query" placeholder="Pregunta al asistente..." (keydown.enter)="send()" style="font-size:0.875rem" />
      <button class="btn btn-primary btn-icon" (click)="send()">➤</button>
    </div>
  </div>
  <button class="ia-fab bg-gradient-to-br-blue-green" (click)="open.set(!open())" title="Asistente IA">
    ✨
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
  open = signal(false);
  query = '';
  messages = signal<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: '¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte?' }
  ]);

  send() {
    if (!this.query.trim()) return;
    const q = this.query;
    this.messages.update(m => [...m, { role: 'user', content: q }]);
    this.query = '';
    setTimeout(() => {
      const view = this.state.currentView();
      let resp = 'Puedo ayudarte con diagnósticos, repuestos y gestión del taller.';
      if (view === 'seguimiento') resp = '🔧 Para diagnóstico: revisa los códigos OBD-II, inspecciona visualmente y documenta el problema con fotos.';
      if (view === 'repuestos') resp = '📦 Para repuestos: verifica compatibilidad por marca/modelo y consulta disponibilidad en tu inventario.';
      this.messages.update(m => [...m, { role: 'ai', content: resp }]);
    }, 800);
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
            {{ i <= estrellas() ? '⭐' : '☆' }}
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
        <button class="btn btn-primary" style="flex:1" (click)="enviar()">
          ⭐ Enviar Solicitud
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
