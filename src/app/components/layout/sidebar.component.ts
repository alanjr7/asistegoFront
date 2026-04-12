import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  state = inject(AppStateService);

  navigation: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'seguimiento', label: 'Seguimiento', icon: 'wrench' },
    { id: 'gruas', label: 'Grúas', icon: 'truck' },
    { id: 'personal', label: 'Personal', icon: 'users-cog' },
    { id: 'pagos', label: 'Pagos', icon: 'dollar-sign' },
    { id: 'repuestos', label: 'Repuestos', icon: 'package' },
    { id: 'clientes', label: 'Clientes', icon: 'users' },
    { id: 'historial', label: 'Historial', icon: 'history' },
    { id: 'chat', label: 'Mensajes', icon: 'message-square' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'bell' },
  ];

  isActive(id: string) {
    return this.state.currentView() === id;
  }

  showBadge(id: string) {
    return id === 'notificaciones' && this.state.notificacionesNoLeidas() > 0;
  }

  navigate(view: string) {
    this.state.navigateTo(view);
  }
}
