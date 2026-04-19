import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Taller, TallerUpdate, StatsResponse } from '../models/types.model';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class TallerService {
  private api = inject(ApiService);
  private baseUrl = environment.apiUrl;

  obtener(): Observable<Taller> {
    return this.api.get<Taller>('taller/');
  }

  actualizar(taller: TallerUpdate): Observable<Taller> {
    return this.api.put<Taller>('taller/', taller);
  }

  getStats(): Observable<StatsResponse> {
    return this.api.get<StatsResponse>('taller/stats');
  }

  /**
   * Actualizar foto de perfil del taller
   * @param file Archivo de imagen
   * @returns Observable con la URL de la nueva foto
   */
  updateFoto(file: File): Observable<{ success: boolean; url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.put<{ success: boolean; url: string; message: string }>('upload/taller/perfil/foto', formData);
  }

  /**
   * Obtener URL completa de la foto de perfil
   * @param fotoUrl URL relativa o absoluta de la foto
   * @returns URL completa para mostrar la imagen
   */
  getFotoUrl(fotoUrl: string | null | undefined): string {
    if (!fotoUrl) {
      // Foto por defecto si no hay
      return 'https://via.placeholder.com/128?text=Taller';
    }
    // Si ya es URL completa (http/https), retornarla
    if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
      return fotoUrl;
    }
    // Si es URL relativa, agregar base URL
    if (fotoUrl.startsWith('/')) {
      return `${this.baseUrl}${fotoUrl}`;
    }
    // Otro caso (ruta sin / inicial)
    return `${this.baseUrl}/${fotoUrl}`;
  }
}
