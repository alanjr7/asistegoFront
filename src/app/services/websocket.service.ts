import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../environment/environment';

export interface WebSocketMessage {
  type: string;
  payload?: any;
  sender?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: WebSocket;
  private messageSubject = new Subject<WebSocketMessage>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private clientId: string | null = null;
  private currentRoom: string | null = null;
  private heartbeatInterval: any = null;

  // API URL - usa environment y detecta protocolo (ws:// vs wss://)
  private readonly baseUrl = this.getWebSocketUrl();

  // Observables públicos
  public messages$: Observable<WebSocketMessage> = this.messageSubject.asObservable();
  public connected$: Observable<boolean> = this.connectionStatus.asObservable();

  constructor() {}

  private getWebSocketUrl(): string {
    const apiUrl = environment.apiUrl;
    // Convertir https:// a wss:// o http:// a ws://
    const wsUrl = apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws');
    return `${wsUrl}/ws`;
  }

  /**
   * Conectar al WebSocket
   */
  connect(clientId: string, room?: string, userType?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.clientId === clientId) {
      console.log('[WebSocket] Ya conectado como', clientId);
      return;
    }

    // Limpiar conexión anterior
    this.disconnect();

    this.clientId = clientId;
    this.currentRoom = room || null;

    const params = new URLSearchParams();
    if (room) params.set('room', room);
    if (userType) params.set('user_type', userType);

    const url = `${this.baseUrl}/${clientId}?${params.toString()}`;
    console.log('[WebSocket] Conectando a:', url);

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[WebSocket] Conectado exitosamente');
      this.connectionStatus.next(true);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('[WebSocket] Mensaje recibido:', data.type);
        this.messageSubject.next(data);
      } catch (e) {
        console.error('[WebSocket] Error procesando mensaje:', e);
      }
    };

    this.socket.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.connectionStatus.next(false);
    };

    this.socket.onclose = () => {
      console.log('[WebSocket] Conexión cerrada');
      this.connectionStatus.next(false);
      this.stopHeartbeat();
      this.scheduleReconnect();
    };
  }

  /**
   * Desconectar
   */
  disconnect(): void {
    console.log('[WebSocket] Desconectando...');
    this.stopHeartbeat();
    this.socket?.close();
    this.connectionStatus.next(false);
  }

  /**
   * Enviar mensaje
   */
  private send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] No conectado, no se puede enviar');
    }
  }

  /**
   * Suscribirse a una solicitud específica
   */
  subscribeToSolicitud(solicitudId: string): void {
    this.send({
      type: 'subscribe_solicitud',
      payload: { solicitud_id: solicitudId }
    });
  }

  /**
   * Unirse a una room
   */
  joinRoom(room: string): void {
    this.send({
      type: 'join_room',
      payload: { room }
    });
    this.currentRoom = room;
  }

  /**
   * Abandonar una room
   */
  leaveRoom(room: string): void {
    this.send({
      type: 'leave_room',
      payload: { room }
    });
  }

  /**
   * Programar reconexión automática
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`[WebSocket] Reconectando en ${delay}ms (intento ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(this.clientId!, this.currentRoom || undefined);
    }, delay);
  }

  /**
   * Heartbeat para mantener conexión viva
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000); // cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ===== Helpers para escuchar eventos específicos =====

  /**
   * Escuchar nuevas solicitudes
   */
  onSolicitudNueva(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'solicitud_nueva'),
      map(msg => msg.payload?.solicitud)
    );
  }

  /**
   * Escuchar solicitud aceptada
   */
  onSolicitudAceptada(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'solicitud_aceptada'),
      map(msg => msg.payload?.solicitud)
    );
  }

  /**
   * Escuchar solicitud rechazada
   */
  onSolicitudRechazada(): Observable<{ solicitudId: string; message: string }> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'solicitud_rechazada'),
      map(msg => ({
        solicitudId: msg.payload?.solicitud_id,
        message: msg.payload?.message
      }))
    );
  }

  /**
   * Escuchar cambios de estado
   */
  onEstadoCambiado(): Observable<{ solicitudId: string; estado: string; solicitud: any }> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'estado_cambiado'),
      map(msg => ({
        solicitudId: msg.payload?.solicitud_id,
        estado: msg.payload?.estado,
        solicitud: msg.payload?.solicitud
      }))
    );
  }

  /**
   * Escuchar mecánico asignado
   */
  onMecanicoAsignado(): Observable<{ solicitudId: string; mecanico: any }> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'mecanico_asignado'),
      map(msg => ({
        solicitudId: msg.payload?.solicitud_id,
        mecanico: msg.payload?.mecanico
      }))
    );
  }

  /**
   * Escuchar servicio finalizado
   */
  onServicioFinalizado(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'servicio_finalizado'),
      map(msg => msg.payload?.solicitud)
    );
  }

  /**
   * Escuchar mensajes de chat
   */
  onChatMensaje(): Observable<any> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'chat_mensaje'),
      map(msg => msg.payload)
    );
  }
}
