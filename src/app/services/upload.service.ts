import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private api = inject(ApiService);

  /**
   * Sube un archivo al servidor y retorna la URL
   * @param file Archivo a subir
   * @param folder Carpeta destino (opcional)
   * @returns URL del archivo subido
   */
  async uploadFile(file: File, folder?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    try {
      const response = await this.api.post<{ url: string }>('upload/', formData).toPromise();
      return response?.url ?? '';
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw new Error('No se pudo subir el archivo');
    }
  }

  /**
   * Sube una imagen (con validación)
   * @param file Archivo de imagen
   * @param maxSizeMB Tamaño máximo en MB
   * @returns URL de la imagen
   */
  async uploadImage(file: File, maxSizeMB: number = 5): Promise<string> {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`La imagen no debe superar ${maxSizeMB}MB`);
    }

    return this.uploadFile(file, 'images');
  }

  /**
   * Sube un audio
   * @param file Archivo de audio
   * @returns URL del audio
   */
  async uploadAudio(file: File): Promise<string> {
    if (!file.type.startsWith('audio/')) {
      throw new Error('El archivo debe ser un audio');
    }

    return this.uploadFile(file, 'audio');
  }

  /**
   * Sube un comprobante de pago
   * @param file Archivo del comprobante
   * @returns URL del comprobante
   */
  async uploadComprobante(file: File): Promise<string> {
    return this.uploadFile(file, 'comprobantes');
  }

  /**
   * Genera una vista previa local de una imagen
   * @param file Archivo de imagen
   * @returns URL de datos (data URL)
   */
  generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
