import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MensajeChat, MensajeChatCreate } from '../models/types.model';

export interface ConsultaIAResponse {
  respuesta: string;
  sugerencias: string[];
  modelo_usado: string;
  tokens_usados: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private api = inject(ApiService);

  obtenerMensajes(solicitudId: string): Observable<MensajeChat[]> {
    return this.api.get<MensajeChat[]>(`chat/${solicitudId}`);
  }

  enviarMensaje(solicitudId: string, mensaje: MensajeChatCreate): Observable<MensajeChat> {
    return this.api.post<MensajeChat>(`chat/${solicitudId}`, mensaje);
  }

  marcarLeidos(solicitudId: string): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>(`chat/${solicitudId}/leer`);
  }

  consultarIA(mensaje: string, solicitudId?: string): Observable<ConsultaIAResponse> {
    return this.api.post<ConsultaIAResponse>('chat/ia/consultar', {
      mensaje,
      solicitud_id: solicitudId
    });
  }
}
