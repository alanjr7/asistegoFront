import { Injectable } from '@angular/core';
import { Cliente, Solicitud, Repuesto, SolicitudRepuesto, Servicio, Notificacion, Personal, Factura, Taller } from '../models/types.model';

export const SANTA_CRUZ_CENTER = { lat: -17.7833, lng: -63.1821 };

@Injectable({ providedIn: 'root' })
export class MockDataService {

  clientes: Cliente[] = [
    { id: '1', nombre: 'Carlos Mendoza', telefono: '+591 7123 4567', foto: 'https://i.pravatar.cc/150?img=12', lat: -17.7856, lng: -63.1789 },
    { id: '2', nombre: 'María González', telefono: '+591 7234 5678', foto: 'https://i.pravatar.cc/150?img=5', lat: -17.7801, lng: -63.1845 },
    { id: '3', nombre: 'Jorge Ramírez', telefono: '+591 7345 6789', foto: 'https://i.pravatar.cc/150?img=8', lat: -17.7890, lng: -63.1756 },
    { id: '4', nombre: 'Ana Flores', telefono: '+591 7456 7890', foto: 'https://i.pravatar.cc/150?img=9', lat: -17.7767, lng: -63.1902 },
  ];

  solicitudes: Solicitud[] = [
    {
      id: '1', cliente: this.clientes[0],
      vehiculo: { id: 'v1', marca: 'Toyota', modelo: 'Corolla', anio: 2018, placa: 'ABC-123', color: 'Blanco', tipo: 'Sedán' },
      descripcion: 'El auto no enciende, parece ser problema de batería',
      distancia: 2.3, estado: 'pendiente', problema: 'No enciende', requiereRepuestos: true,
      timestamp: new Date(), audio: 'mock-audio-url',
      imagenes: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400', 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400'],
      analisisIA: {
        piezasDetectadas: ['Batería 12V', 'Cables de batería'],
        danosIdentificados: ['Batería descargada', 'Posibles bornes sulfatados'],
        tipoProblema: 'Sistema eléctrico - Batería',
        recomendaciones: ['Verificar voltaje de batería', 'Revisar sistema de carga', 'Limpiar bornes'],
      },
      tipo: 'grua',
    },
    {
      id: '2', cliente: this.clientes[1],
      vehiculo: { id: 'v2', marca: 'Honda', modelo: 'Civic', anio: 2020, placa: 'XYZ-789', color: 'Rojo', tipo: 'Sedán' },
      descripcion: 'Ruido extrano al frenar',
      distancia: 1.8, estado: 'pendiente', problema: 'Frenos', requiereRepuestos: false,
      timestamp: new Date(),
      analisisIA: { tipoProblema: 'Sistema de frenos', recomendaciones: ['Inspeccionar pastillas de freno', 'Verificar discos'] },
    },
    {
      id: '3', cliente: this.clientes[2],
      vehiculo: { id: 'v3', marca: 'Nissan', modelo: 'Sentra', anio: 2019, placa: 'DEF-456', color: 'Gris', tipo: 'Sedán' },
      descripcion: 'Llanta pinchada, necesito cambio urgente',
      distancia: 3.1, estado: 'pendiente', problema: 'Llanta pinchada', requiereRepuestos: true,
      timestamp: new Date(),
      imagenes: ['https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400'],
    },
  ];

  repuestos: Repuesto[] = [
    { id: 'r1', nombre: 'Batería 12V 60Ah', descripcion: 'Batería de alta calidad para vehículos sedán', precio: 450, imagen: 'https://images.unsplash.com/photo-1609412825868-0d4c9c5c0f3e?w=300', disponible: true, marca: 'Bosch', categoria: 'Sistema Eléctrico', vehiculosCompatibles: ['Toyota Corolla', 'Honda Civic', 'Nissan Sentra'] },
    { id: 'r2', nombre: 'Pastillas de Freno Delanteras', descripcion: 'Pastillas de freno cerámicas premium', precio: 280, imagen: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300', disponible: true, marca: 'Brembo', categoria: 'Sistema de Frenos', vehiculosCompatibles: ['Honda Civic', 'Toyota Corolla'] },
    { id: 'r3', nombre: 'Aceite Sintético 5W-30', descripcion: 'Aceite de motor sintético de alto rendimiento', precio: 120, imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', disponible: true, marca: 'Castrol', categoria: 'Lubricantes', vehiculosCompatibles: ['Todos'] },
    { id: 'r4', nombre: 'Filtro de Aire', descripcion: 'Filtro de aire de alta eficiencia', precio: 65, disponible: false, marca: 'Mann', categoria: 'Filtros', vehiculosCompatibles: ['Toyota Corolla', 'Nissan Sentra'] },
    { id: 'r5', nombre: 'Amortiguadores Traseros (Par)', descripcion: 'Par de amortiguadores para eje trasero', precio: 650, imagen: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=300', disponible: true, marca: 'Monroe', categoria: 'Suspensión', vehiculosCompatibles: ['Honda Civic', 'Toyota Corolla'] },
  ];

  solicitudesRepuesto: SolicitudRepuesto[] = [
    { id: 'sr1', repuestoId: 'r1', clienteId: '1', vehiculo: this.solicitudes[0].vehiculo, cantidad: 1, estado: 'pendiente', imagenReferencia: 'https://images.unsplash.com/photo-1609412825868-0d4c9c5c0f3e?w=400', timestamp: new Date() },
    { id: 'sr2', repuestoId: 'r2', clienteId: '2', vehiculo: this.solicitudes[1].vehiculo, cantidad: 1, estado: 'pendiente', timestamp: new Date() },
  ];

  servicios: Servicio[] = [
    { id: 's1', solicitudId: '100', cliente: this.clientes[3], vehiculo: { id: 'v4', marca: 'Mazda', modelo: '3', anio: 2017, placa: 'GHI-321', color: 'Azul', tipo: 'Sedán' }, problema: 'Cambio de aceite y filtros', solucion: 'Se realizó cambio de aceite sintético 5W-30 y filtro de aceite', monto: 250, fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), duracion: 45 },
    { id: 's2', solicitudId: '101', cliente: this.clientes[0], vehiculo: this.solicitudes[0].vehiculo, problema: 'Batería descargada', solucion: 'Carga de batería y limpieza de bornes', monto: 80, fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), duracion: 30 },
    { id: 's3', solicitudId: '102', cliente: this.clientes[1], vehiculo: this.solicitudes[1].vehiculo, problema: 'Cambio de pastillas de freno', solucion: 'Instalación de pastillas de freno Brembo delanteras', monto: 380, fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), duracion: 60 },
  ];

  notificaciones: Notificacion[] = [
    { id: 'n1', tipo: 'solicitud', titulo: 'Nueva solicitud de emergencia', mensaje: 'Carlos Mendoza necesita asistencia a 2.3 km', timestamp: new Date(), leida: false },
    { id: 'n2', tipo: 'repuesto', titulo: 'Solicitud de repuesto', mensaje: 'María González solicita Pastillas de Freno Delanteras', timestamp: new Date(Date.now() - 15 * 60 * 1000), leida: false },
    { id: 'n3', tipo: 'mensaje', titulo: 'Nuevo mensaje', mensaje: 'Jorge Ramírez envió un mensaje', timestamp: new Date(Date.now() - 30 * 60 * 1000), leida: true },
  ];

  personal: Personal[] = [
    { id: 'p1', nombre: 'José Martínez', rol: 'mecanico', estado: 'disponible', foto: 'https://i.pravatar.cc/150?img=13', telefono: '+591 7111 2222', asistenciasDia: 3, asistenciasMes: 45 },
    { id: 'p2', nombre: 'Alexis Rojas', rol: 'electrico', estado: 'en_camino', foto: 'https://i.pravatar.cc/150?img=14', telefono: '+591 7222 3333', asistenciasDia: 2, asistenciasMes: 38 },
    { id: 'p3', nombre: 'Mario Sánchez', rol: 'grua', estado: 'regresando', foto: 'https://i.pravatar.cc/150?img=15', telefono: '+591 7333 4444', asistenciasDia: 1, asistenciasMes: 22 },
    { id: 'p4', nombre: 'Oscar López', rol: 'mecanico', estado: 'ocupado', foto: 'https://i.pravatar.cc/150?img=16', telefono: '+591 7444 5555', asistenciasDia: 4, asistenciasMes: 52 },
    { id: 'p5', nombre: 'Ricardo Torres', rol: 'administrador', foto: 'https://i.pravatar.cc/150?img=17', telefono: '+591 7555 6666', asistenciasDia: 0, asistenciasMes: 0 },
    { id: 'p6', nombre: 'Fernando Díaz', rol: 'encargado', foto: 'https://i.pravatar.cc/150?img=18', telefono: '+591 7666 7777', asistenciasDia: 0, asistenciasMes: 0 },
  ];

  facturas: Factura[] = [
    { id: 'f1', servicioId: 's1', cliente: this.clientes[0], monto: 250, comision: 25, total: 275, fecha: new Date(), metodoPago: 'qr', comprobante: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300', enviada: true },
    { id: 'f2', servicioId: 's2', cliente: this.clientes[1], monto: 500, comision: 50, total: 550, fecha: new Date(), metodoPago: 'tarjeta', enviada: true },
    { id: 'f3', servicioId: 's3', cliente: this.clientes[2], monto: 100, comision: 10, total: 110, fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), metodoPago: 'qr', enviada: false },
  ];

  taller: Taller = {
    id: 't1', nombre: 'Taller AsisteGO',
    foto: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
    ubicacion: 'Av. Cristo Redentor, Santa Cruz, Bolivia',
    telefono: '+591 3 123 4567', email: 'contacto@asistego.com',
    calificacion: 4.8, totalServicios: 1247,
    descripcion: 'Taller mecánico especializado en asistencia móvil 24/7. Servicio profesional y de calidad.',
  };
}
