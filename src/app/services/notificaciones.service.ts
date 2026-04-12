import { Injectable, inject, signal, effect } from '@angular/core';
import { Observable, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Notificacion, NotificacionCreate, NotificacionUpdate } from '../models/types.model';

interface CountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private api = inject(ApiService);
  
  // Signals para estado reactivo
  notificaciones = signal<Notificacion[]>([]);
  noLeidasCount = signal<number>(0);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  private pollingSub?: Subscription;

  constructor() {
    // Efecto para mantener sincronizado el contador
    effect(() => {
      const count = this.notificaciones().filter(n => !n.leida).length;
      this.noLeidasCount.set(count);
    }, { allowSignalWrites: true });
  }

  // Iniciar polling cada 30 segundos
  iniciarPolling(intervalMs: number = 30000) {
    this.detenerPolling(); // Detener si ya existe
    this.loading.set(true);
    
    this.pollingSub = interval(intervalMs).pipe(
      switchMap(() => this.listar(true)), // Solo no leídas
      catchError(err => {
        this.error.set('Error al cargar notificaciones');
        return [];
      })
    ).subscribe(data => {
      this.notificaciones.set(data);
      this.loading.set(false);
    });
    
    // Cargar inmediatamente la primera vez
    this.cargarNotificaciones();
  }

  detenerPolling() {
    this.pollingSub?.unsubscribe();
  }

  async cargarNotificaciones() {
    this.loading.set(true);
    try {
      const data = await this.listar().toPromise();
      this.notificaciones.set(data ?? []);
    } catch (e) {
      this.error.set('Error al cargar notificaciones');
    } finally {
      this.loading.set(false);
    }
  }

  async marcarComoLeidaLocal(id: string) {
    this.notificaciones.update(list =>
      list.map(n => n.id === id ? { ...n, leida: true } : n)
    );
    // También enviar al servidor
    try {
      await this.marcarComoLeida(id).toPromise();
    } catch (e) {
      console.error('Error al marcar como leída:', e);
    }
  }

  async marcarTodasLeidasLocal() {
    this.notificaciones.update(list => list.map(n => ({ ...n, leida: true })));
    try {
      await this.marcarTodasLeidas().toPromise();
    } catch (e) {
      console.error('Error al marcar todas como leídas:', e);
    }
  }

  listar(soloNoLeidas?: boolean): Observable<Notificacion[]> {
    const params = soloNoLeidas ? { solo_no_leidas: true } : undefined;
    return this.api.get<Notificacion[]>('notificaciones/', params);
  }

  contarNoLeidas(): Observable<CountResponse> {
    return this.api.get<CountResponse>('notificaciones/no-leidas/count');
  }

  crear(notificacion: NotificacionCreate): Observable<Notificacion> {
    return this.api.post<Notificacion>('notificaciones/', notificacion);
  }

  marcarComoLeida(id: string): Observable<Notificacion> {
    return this.api.put<Notificacion>(`notificaciones/${id}/leer`);
  }

  marcarTodasLeidas(): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>('notificaciones/leer-todas');
  }

  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`notificaciones/${id}`);
  }
}
