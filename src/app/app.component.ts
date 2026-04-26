import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from './services/app-state.service';
import { SidebarComponent } from './components/layout/sidebar.component';
import { TopbarComponent } from './components/layout/topbar.component';
import { LoginViewComponent } from './views/login-view.component';
import { RegisterViewComponent } from './views/register-view.component';
import { DashboardViewComponent } from './views/dashboard-view.component';
import { LandingViewComponent } from './views/landing-view.component';
import { AdminDashboardViewComponent } from './views/admin-dashboard-view.component';
import {
  ChatViewComponent,
  SeguimientoViewComponent,
  PagosViewComponent,
  RepuestosViewComponent,
  ClientesViewComponent,
  HistorialViewComponent,
  NotificacionesViewComponent,
  PersonalViewComponent,
  PerfilTallerViewComponent,
  GruaViewComponent,
} from './views/all-views.component';
import { IAWidgetComponent, CalificacionModalComponent } from './components/widgets/widgets.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    TopbarComponent,
    LoginViewComponent,
    RegisterViewComponent,
    LandingViewComponent,
    AdminDashboardViewComponent,
    DashboardViewComponent,
    ChatViewComponent,
    SeguimientoViewComponent,
    PagosViewComponent,
    RepuestosViewComponent,
    ClientesViewComponent,
    HistorialViewComponent,
    NotificacionesViewComponent,
    PersonalViewComponent,
    PerfilTallerViewComponent,
    GruaViewComponent,
    IAWidgetComponent,
    CalificacionModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  private notifInterval: any;

  constructor() {
    effect(() => {
      if (!this.state.isAuthenticated()) {
        // Si no está autenticado, mostrar landing page (no login directamente)
        const currentView = this.state.currentView();
        // Solo cambiar a landing si no está en login o register
        if (currentView !== 'login' && currentView !== 'register' && currentView !== 'landing') {
          this.state.currentView.set('landing');
        }
      }
    });
  }

  ngOnInit() {
    // Simular notificaciones en tiempo real cada 30 segundos
    this.notifInterval = setInterval(() => {
      if (this.state.notificacionesNoLeidas() < 5 && Math.random() > 0.7) {
        const tipos: Array<'solicitud' | 'repuesto' | 'pago' | 'mensaje'> = ['solicitud', 'repuesto', 'pago', 'mensaje'];
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        const mensajes = {
          solicitud: 'Nueva solicitud de emergencia cerca de ti',
          repuesto: 'Solicitud de repuesto recibida',
          pago: 'Pago confirmado por cliente',
          mensaje: 'Nuevo mensaje de cliente',
        };
        this.state.addNotificacion({ tipo, titulo: `Nueva ${tipo}`, mensaje: mensajes[tipo] });
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.notifInterval) clearInterval(this.notifInterval);
  }
}
