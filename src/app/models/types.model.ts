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
  estado: 'pendiente' | 'aceptada' | 'en_camino' | 'reparando' | 'finalizada';
  problema: string;
  requiereRepuestos: boolean;
  timestamp: Date;
  audio?: string;
  imagenes?: string[];
  analisisIA?: AnalisisIA;
  tipo?: 'normal' | 'grua';
  mecanicoAsignado?: Personal;
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

export interface Factura {
  id: string;
  servicioId: string;
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
