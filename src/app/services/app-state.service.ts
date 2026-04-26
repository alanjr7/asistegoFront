import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Solicitud, Notificacion, Calificacion } from '../models/types.model';
import { MockDataService } from './mock-data.service';
import { AuthService } from './auth.service';
import { NotificacionesService } from './notificaciones.service';
import { SolicitudesService } from './solicitudes.service';
import { catchError, of } from 'rxjs';

interface JwtPayload {
  sub?: string;
  nombre?: string;
  rol?: string;
  taller_id?: string;
  tipo_usuario?: string;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private authService = inject(AuthService);
  private notificacionesService = inject(NotificacionesService);
  private solicitudesService = inject(SolicitudesService);
  isAuthenticated = signal(false);
  currentView = signal('landing');
  userRole = signal<string | null>(null);
  userNombre = signal<string | null>(null);
  userEmail = signal<string | null>(null);
  userTallerId = signal<string | null>(null);
  solicitudActiva = signal<Solicitud | null>(null);
  solicitudPendienteSeleccionada = signal<Solicitud | null>(null);
  notificaciones = signal<Notificacion[]>([]);
  showCalificacionModal = signal(false);
  servicioParaCalificar = signal<Solicitud | null>(null);
  loginError = signal<string | null>(null);
  registerError = signal<string | null>(null);
  solicitudesPendientesCount = signal<number>(0);

  // Computed que muestra el conteo de solicitudes pendientes
  notificacionesNoLeidas = computed(() =>
    this.solicitudesPendientesCount()
  );

  // Computed para verificar si es admin
  isAdmin = computed(() => this.userRole() === 'administrador');
  isTallerUser = computed(() => this.userRole() === 'encargado' || this.userRole() === 'mecanico');

  constructor(private mockData: MockDataService) {
    // Inicializar con datos del mock si no hay conexión
    this.notificacionesService.notificaciones.set([...mockData.notificaciones]);
    
    // Sincronizar el signal local con el del servicio usando effect
    effect(() => {
      const notifs = this.notificacionesService.notificaciones();
      this.notificaciones.set(notifs);
    }, { allowSignalWrites: true });

    // Verificar si hay token guardado y restaurar sesión
    const token = localStorage.getItem('token');
    if (token) {
      this.decodeAndSetUserFromToken(token);
      this.isAuthenticated.set(true);
      // Redirigir según el rol
      if (this.isAdmin()) {
        this.currentView.set('admin-dashboard');
      } else {
        this.currentView.set('dashboard');
      }
      this.iniciarNotificaciones();
    }
  }

  iniciarNotificaciones() {
    this.notificacionesService.iniciarPolling(30000); // Cada 30 segundos
    this.cargarSolicitudesPendientes();
  }

  cargarSolicitudesPendientes() {
    this.solicitudesService.listar({ pendientes: true }).subscribe({
      next: (data) => this.solicitudesPendientesCount.set(data.length),
      error: () => this.solicitudesPendientesCount.set(0)
    });
  }

  detenerNotificaciones() {
    this.notificacionesService.detenerPolling();
  }

  private decodeAndSetUserFromToken(token: string): void {
    try {
      const payload = this.decodeJwt(token);
      if (payload) {
        this.userRole.set(payload.rol || null);
        this.userNombre.set(payload.nombre || null);
        this.userEmail.set(payload.sub || null);
        this.userTallerId.set(payload.taller_id || null);
      }
    } catch (e) {
      console.error('Error decodificando token:', e);
    }
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  login(email: string, password: string, rememberMe: boolean) {
    this.loginError.set(null);
    
    this.authService.login({ email, password, rememberMe })
      .pipe(
        catchError(err => {
          this.loginError.set(err.error?.detail || 'Error de conexión');
          return of({ success: false, message: 'Error' });
        })
      )
      .subscribe(response => {
        if (response.success) {
          const token = localStorage.getItem('token');
          if (token) {
            this.decodeAndSetUserFromToken(token);
          }
          this.isAuthenticated.set(true);
          // Redirigir según rol
          if (this.isAdmin()) {
            this.currentView.set('admin-dashboard');
          } else {
            this.currentView.set('dashboard');
          }
          // Iniciar polling de notificaciones
          this.iniciarNotificaciones();
        }
      });
  }

  register(nombre: string, email: string, password: string) {
    this.registerError.set(null);
    
    this.authService.register({ nombre, email, password })
      .pipe(
        catchError(err => {
          this.registerError.set(err.error?.detail || 'Error al registrar usuario');
          return of({ success: false, message: 'Error' });
        })
      )
      .subscribe(response => {
        if (response.success) {
          const token = localStorage.getItem('token');
          if (token) {
            this.decodeAndSetUserFromToken(token);
          }
          this.isAuthenticated.set(true);
          // Redirigir según rol
          if (this.isAdmin()) {
            this.currentView.set('admin-dashboard');
          } else {
            this.currentView.set('dashboard');
          }
          // Iniciar polling de notificaciones
          this.iniciarNotificaciones();
        }
      });
  }

  logout() {
    this.authService.logout();
    this.detenerNotificaciones();
    this.isAuthenticated.set(false);
    this.userRole.set(null);
    this.userNombre.set(null);
    this.userEmail.set(null);
    this.userTallerId.set(null);
    this.currentView.set('landing');
    this.solicitudActiva.set(null);
  }

  navigateTo(view: string) { this.currentView.set(view); }

  seleccionarSolicitudPendiente(solicitud: Solicitud) {
    this.solicitudPendienteSeleccionada.set(solicitud);
    this.currentView.set('seguimiento');
  }

  limpiarSolicitudPendiente() {
    this.solicitudPendienteSeleccionada.set(null);
  }

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
      landing: 'Bienvenido',
      login: 'Iniciar Sesión',
      register: 'Registro',
      'admin-dashboard': 'Panel de Administración',
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
      gruas: 'Gestión de Grúas',
    };
    return map[this.currentView()] ?? 'AsisteGO';
  }
}
