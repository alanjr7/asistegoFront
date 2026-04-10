# AsisteGO - Angular

Sistema de gestión para talleres mecánicos, convertido de React a Angular 17.

## Tecnologías
- **Angular 17** con Standalone Components
- **Angular Signals** (equivalente a useState de React)
- **Leaflet** para mapas
- **TypeScript** estricto

## Estructura del proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.component.ts/html/css
│   │   │   └── topbar.component.ts/html/css
│   │   └── widgets/
│   │       └── widgets.component.ts  (IAWidget + CalificacionModal)
│   ├── models/
│   │   └── types.model.ts
│   ├── services/
│   │   ├── app-state.service.ts   (estado global con Signals)
│   │   └── mock-data.service.ts   (datos de prueba)
│   ├── views/
│   │   ├── login-view.component.ts/html/css
│   │   ├── dashboard-view.component.ts/html/css
│   │   └── all-views.component.ts  (Chat, Seguimiento, Pagos, Repuestos,
│   │                                Clientes, Historial, Notificaciones,
│   │                                Personal, PerfilTaller)
│   ├── app.component.ts/html/css
├── styles/
│   └── global.css
└── index.html
```

## Equivalencias React → Angular

| React | Angular |
|-------|---------|
| `useState` | `signal()` |
| `useEffect` | `ngOnInit` / `ngOnDestroy` |
| Props / callbacks | `@Input()` / `@Output()` |
| Context API | Injectable Service |
| JSX | Templates HTML |
| Tailwind clases | CSS propio en `global.css` |
| `className={cn(...)}` | `[class.active]="condition"` |
| `map()` en JSX | `*ngFor` |
| Condicionales `&&` | `*ngIf` |
| React Router | Navegación por Signal en AppStateService |

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Build de producción
npm run build
```

La app correrá en: http://localhost:4200

## Vistas disponibles
- **Login** - Autenticación con email/password y redes sociales
- **Dashboard** - Mapa con solicitudes, stats, radio de búsqueda
- **Seguimiento** - Mapa en tiempo real, estados del servicio
- **Chat** - Mensajería con clientes, transcripción IA
- **Pagos** - Confirmación de pagos, facturas, reportes
- **Repuestos** - Inventario y solicitudes de clientes
- **Clientes** - Lista y historial por cliente
- **Historial** - Registro completo de servicios
- **Notificaciones** - Centro de notificaciones en tiempo real
- **Personal** - Gestión del equipo
- **Perfil del Taller** - Configuración y estadísticas

## Colores de marca
- Azul: `#2563eb`
- Verde: `#22c55e`
- Gradiente: `linear-gradient(to right, #2563eb, #22c55e)`
