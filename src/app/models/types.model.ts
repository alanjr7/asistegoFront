export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  foto?: string;
  lat: number;
  lng: number;
  vecesAtendido?: number;
  calificacionPromedio?: number;
}

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string;
  tipo: string;
}

export interface AnalisisIA {
  piezasDetectadas?: string[];
  danosIdentificados?: string[];
  tipoProblema?: string;
  recomendaciones?: string[];
}

export interface Solicitud {
  id: string;
  cliente: Cliente;
  vehiculo: Vehiculo;
  descripcion: string;
  distancia: number;
  estado: 'pendiente' | 'aceptada' | 'en_camino' | 'reparando' | 'finalizada' | 'rechazada' | 'cancelada';
  problema: string;
  requiereRepuestos: boolean;
  timestamp: Date;
  audio?: string;
  imagenes?: string[];
  analisisIA?: AnalisisIA;
  tipo?: 'normal' | 'grua';
  mecanicoAsignado?: Personal;
  personalAsignado?: PersonalAsignado[];  // Nuevo campo para múltiples técnicos
}

export interface Repuesto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  disponible: boolean;
  marca: string;
  categoria: string;
  vehiculosCompatibles: string[];
  stock?: number;
}

export interface SolicitudRepuesto {
  id: string;
  repuestoId: string;
  clienteId: string;
  vehiculo: Vehiculo;
  cantidad: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  imagenReferencia?: string;
  timestamp: Date;
}

export interface Servicio {
  id: string;
  solicitudId: string;
  cliente: Cliente;
  vehiculo: Vehiculo;
  problema: string;
  solucion: string;
  monto: number;
  fecha: Date;
  duracion: number;
}

export interface Notificacion {
  id: string;
  tipo: 'solicitud' | 'repuesto' | 'mensaje' | 'pago';
  titulo: string;
  mensaje: string;
  timestamp: Date;
  leida: boolean;
}

export interface MensajeChat {
  id: string;
  emisor: 'cliente' | 'taller';
  contenido: string;
  timestamp: Date;
  tipo: 'texto' | 'imagen' | 'audio';
  imagen?: string;
  audio?: string;
  transcripcion?: string;
}

export interface Personal {
  id: string;
  nombre: string;
  rol: 'mecanico' | 'electrico' | 'grua' | 'administrador' | 'encargado';
  estado?: 'disponible' | 'ocupado' | 'en_camino' | 'regresando';
  foto?: string;
  telefono?: string;
  asistenciasDia: number;
  asistenciasMes: number;
}

export interface PersonalAsignado {
  id: string;
  nombre: string;
  rol: 'mecanico' | 'electrico' | 'grua' | 'administrador' | 'encargado';
  foto?: string;
  telefono?: string;
  fechaAsignacion: Date;
}

export interface Factura {
  id: string;
  solicitudId: string;
  cliente: Cliente;
  monto: number;
  comision: number;
  total: number;
  fecha: Date;
  metodoPago: 'qr' | 'tarjeta' | 'efectivo';
  comprobante?: string;
  enviada: boolean;
}

export interface Calificacion {
  id: string;
  servicioId: string;
  clienteId: string;
  estrellas: number;
  comentarios: string[];
  timestamp: Date;
}

export interface Taller {
  id: string;
  nombre: string;
  foto?: string;
  ubicacion: string;
  telefono: string;
  email: string;
  calificacion: number;
  totalServicios: number;
  descripcion?: string;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  onClick?: () => void;
}

// ============ TIPOS ENUMERADOS ============
export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'en_camino' | 'reparando' | 'finalizada' | 'rechazada' | 'cancelada';
export type EstadoSolicitudRepuesto = 'pendiente' | 'aceptada' | 'rechazada';
export type EstadoPersonal = 'disponible' | 'ocupado' | 'en_camino' | 'regresando';
export type RolPersonal = 'mecanico' | 'electrico' | 'grua' | 'administrador' | 'encargado';
export type TipoSolicitud = 'normal' | 'grua';
export type TipoNotificacion = 'solicitud' | 'repuesto' | 'mensaje' | 'pago';
export type TipoMensaje = 'texto' | 'imagen' | 'audio';
export type MetodoPago = 'qr' | 'tarjeta' | 'efectivo';
export type EmisorMensaje = 'cliente' | 'taller';

// ============ INTERFACES CREATE ============
export interface ClienteCreate {
  nombre: string;
  telefono: string;
  email?: string;
  foto?: string;
  lat: number;
  lng: number;
}

export interface ClienteUpdate {
  nombre?: string;
  telefono?: string;
  email?: string;
  foto?: string;
  lat?: number;
  lng?: number;
}

export interface VehiculoCreate {
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string;
  tipo: string;
}

export interface SolicitudCreate {
  cliente_id: string;
  vehiculo: VehiculoCreate;
  descripcion: string;
  distancia: number;
  estado?: EstadoSolicitud;
  problema: string;
  requiere_repuestos: boolean;
  audio?: string;
  imagenes?: string[];
  analisis_ia?: AnalisisIA;
  tipo?: TipoSolicitud;
}

export interface SolicitudUpdate {
  descripcion?: string;
  distancia?: number;
  estado?: EstadoSolicitud;
  problema?: string;
  requiere_repuestos?: boolean;
  audio?: string;
  imagenes?: string[];
  analisis_ia?: AnalisisIA;
  tipo?: TipoSolicitud;
  mecanico_asignado_id?: string;
}

export interface RepuestoCreate {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  disponible: boolean;
  marca: string;
  categoria: string;
  vehiculos_compatibles: string[];
}

export interface RepuestoUpdate {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen?: string;
  disponible?: boolean;
  marca?: string;
  categoria?: string;
  vehiculos_compatibles?: string[];
}

export interface SolicitudRepuestoCreate {
  repuesto_id: string;
  cliente_id: string;
  vehiculo: VehiculoCreate;
  cantidad?: number;
  estado?: EstadoSolicitudRepuesto;
  imagen_referencia?: string;
}

export interface SolicitudRepuestoUpdate {
  cantidad?: number;
  estado?: EstadoSolicitudRepuesto;
  imagen_referencia?: string;
}

export interface ServicioCreate {
  solicitud_id: string;
  cliente_id: string;
  vehiculo: VehiculoCreate;
  problema: string;
  solucion: string;
  monto: number;
  duracion: number;
}

export interface ServicioUpdate {
  problema?: string;
  solucion?: string;
  monto?: number;
  duracion?: number;
}

export interface NotificacionCreate {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida?: boolean;
}

export interface NotificacionUpdate {
  leida?: boolean;
}

export interface MensajeChatCreate {
  emisor: EmisorMensaje;
  contenido: string;
  tipo?: TipoMensaje;
  imagen?: string;
  audio?: string;
  transcripcion?: string;
}

export interface PersonalCreate {
  nombre: string;
  rol: RolPersonal;
  estado?: EstadoPersonal;
  foto?: string;
  telefono?: string;
  asistencias_dia?: number;
  asistencias_mes?: number;
}

export interface PersonalUpdate {
  nombre?: string;
  rol?: RolPersonal;
  estado?: EstadoPersonal;
  foto?: string;
  telefono?: string;
  asistencias_dia?: number;
  asistencias_mes?: number;
}

export interface FacturaCreate {
  solicitud_id: string;
  cliente_id: string;
  monto: number;
  metodo_pago: MetodoPago;
  items?: Array<{descripcion: string, cantidad: number, precioUnitario: number}>;
}

export interface FacturaUpdate {
  monto?: number;
  comision?: number;
  total?: number;
  metodo_pago?: MetodoPago;
  comprobante?: string;
  enviada?: boolean;
}

export interface TallerUpdate {
  nombre?: string;
  foto?: string;
  ubicacion?: string;
  telefono?: string;
  email?: string;
  calificacion?: number;
  total_servicios?: number;
  descripcion?: string;
}

export interface StatsResponse {
  total_servicios: number;
  servicios_hoy: number;
  servicios_mes: number;
  ingresos_totales: number;
  calificacion_promedio: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message: string;
}

// ============ EVIDENCIAS ============
export type TipoEvidencia = 'imagen' | 'audio' | 'video';

export interface Evidencia {
  id: string;
  solicitud_id: string;
  tipo: TipoEvidencia;
  url: string;
  descripcion?: string;
  subido_por: string;
  lat?: number;
  lng?: number;
  timestamp: string;
}

export interface EvidenciaCreate {
  solicitud_id: string;
  tipo: TipoEvidencia;
  url: string;
  descripcion?: string;
  subido_por: string;
  lat?: number;
  lng?: number;
}

// ============ COMPROBANTES DE PAGO ============
export interface ComprobantePago {
  id: string;
  solicitud_id: string;
  monto: number;
  metodo_pago: MetodoPago;
  url_imagen?: string;
  notas?: string;
  verificado: boolean;
  rechazado?: boolean;
  motivo_rechazo?: string;
  timestamp: string;
}

export interface ComprobantePagoCreate {
  solicitud_id: string;
  monto: number;
  metodo_pago: MetodoPago;
  url_imagen?: string;
  notas?: string;
}

// ============ UBICACIÓN GRÚA ============
export interface UbicacionGrua {
  id: string;
  gruista_id: string;
  lat: number;
  lng: number;
  disponible: boolean;
  en_servicio: boolean;
  solicitud_id?: string;
  timestamp: string;
}

export interface AsignacionGruaResponse {
  success: boolean;
  message: string;
  gruista_id?: string;
  gruista_nombre?: string;
  distancia_km?: number;
  tiempo_estimado_min?: number;
}

export interface TrackingGruaResponse {
  solicitud_id: string;
  estado: EstadoSolicitud;
  gruista: {
    id: string;
    nombre?: string;
    foto?: string;
    telefono?: string;
    lat: number;
    lng: number;
    timestamp: string;
  };
  cliente: {
    lat: number;
    lng: number;
  };
  distancia_actual_km: number;
  tiempo_estimado_min: number;
}
