import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { AppStateService } from '../services/app-state.service';
import { Subject, takeUntil } from 'rxjs';

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard-view.component.html',
  styleUrls: ['./admin-dashboard-view.component.css']
})
export class AdminDashboardViewComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  state = inject(AppStateService);

  private destroy$ = new Subject<void>();

  stats: StatCard[] = [];
  loading = true;
  error: string | null = null;

  // Datos crudos
  talleresCount = 0;
  clientesCount = 0;
  solicitudesCount = 0;
  personalCount = 0;
  repuestosCount = 0;
  usuariosCount = 0;
  ingresosTotales = 0;
  comisionesTotales = 0;

  // Solicitudes por estado
  solicitudesPorEstado: Record<string, number> = {};

  // Actividad reciente
  actividadReciente: any = null;

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarActividadReciente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEstadisticas(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.talleresCount = data.conteos.talleres;
          this.clientesCount = data.conteos.clientes;
          this.solicitudesCount = data.conteos.solicitudes;
          this.personalCount = data.conteos.personal;
          this.repuestosCount = data.conteos.repuestos;
          this.usuariosCount = data.conteos.usuarios_registrados;
          this.ingresosTotales = data.finanzas.ingresos_totales;
          this.comisionesTotales = data.finanzas.comisiones_totales;
          this.solicitudesPorEstado = data.solicitudes.por_estado;

          this.actualizarStatsCards();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar estadísticas';
          this.loading = false;
          console.error('Error cargando stats:', err);
        }
      });
  }

  cargarActividadReciente(): void {
    this.adminService.getActividadReciente(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.actividadReciente = data;
        },
        error: (err) => {
          console.error('Error cargando actividad:', err);
        }
      });
  }

  actualizarStatsCards(): void {
    this.stats = [
      {
        title: 'Talleres',
        value: this.talleresCount,
        icon: 'taller',
        color: 'blue'
      },
      {
        title: 'Clientes',
        value: this.clientesCount,
        icon: 'cliente',
        color: 'green'
      },
      {
        title: 'Solicitudes',
        value: this.solicitudesCount,
        icon: 'solicitud',
        color: 'orange'
      },
      {
        title: 'Personal',
        value: this.personalCount,
        icon: 'personal',
        color: 'purple'
      },
      {
        title: 'Repuestos',
        value: this.repuestosCount,
        icon: 'repuesto',
        color: 'pink'
      },
      {
        title: 'Ingresos Totales',
        value: this.formatearMoneda(this.ingresosTotales),
        icon: 'dinero',
        color: 'teal'
      }
    ];
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(valor);
  }

  getEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'aceptada': 'bg-blue-100 text-blue-800',
      'en_camino': 'bg-indigo-100 text-indigo-800',
      'reparando': 'bg-purple-100 text-purple-800',
      'finalizada': 'bg-green-100 text-green-800',
      'rechazada': 'bg-red-100 text-red-800',
      'cancelada': 'bg-gray-100 text-gray-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'aceptada': 'Aceptada',
      'en_camino': 'En Camino',
      'reparando': 'Reparando',
      'finalizada': 'Finalizada',
      'rechazada': 'Rechazada',
      'cancelada': 'Cancelada'
    };
    return labels[estado] || estado;
  }

  getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      'taller': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
      'cliente': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`,
      'solicitud': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
      'personal': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      'repuesto': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path></svg>`,
      'dinero': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
    };
    return icons[iconName] || icons['solicitud'];
  }

  refreshData(): void {
    this.cargarEstadisticas();
    this.cargarActividadReciente();
  }

  logout(): void {
    this.state.logout();
  }

  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }
}
