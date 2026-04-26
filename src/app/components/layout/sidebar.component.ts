import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { TallerService } from '../../services/taller.service';
import { Taller } from '../../models/types.model';

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
export class SidebarComponent implements OnInit {
  state = inject(AppStateService);
  tallerService = inject(TallerService);

  taller = signal<Taller | null>(null);
  nombreTaller = computed(() => this.taller()?.nombre ?? 'AsisteGO');

  ngOnInit(): void {
    this.cargarTaller();
  }

  cargarTaller(): void {
    this.tallerService.obtener().subscribe({
      next: (t) => this.taller.set(t),
      error: () => this.taller.set(null),
    });
  }

  navigation: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'seguimiento', label: 'Seguimiento', icon: 'wrench' },
    { id: 'gruas', label: 'Grúas', icon: 'grua' },
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
