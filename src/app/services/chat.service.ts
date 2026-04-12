import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MensajeChat, MensajeChatCreate } from '../models/types.model';

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
}
