import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Repuesto, RepuestoCreate, RepuestoUpdate } from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class RepuestosService {
  private api = inject(ApiService);

  listar(filtros?: {
    categoria?: string;
    disponible?: boolean;
    q?: string;
  }): Observable<Repuesto[]> {
    return this.api.get<Repuesto[]>('repuestos/', filtros);
  }

  obtener(id: string): Observable<Repuesto> {
    return this.api.get<Repuesto>(`repuestos/${id}`);
  }

  crear(repuesto: RepuestoCreate): Observable<Repuesto> {
    return this.api.post<Repuesto>('repuestos/', repuesto);
  }

  actualizar(id: string, repuesto: RepuestoUpdate): Observable<Repuesto> {
    return this.api.put<Repuesto>(`repuestos/${id}`, repuesto);
  }

  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`repuestos/${id}`);
  }

  porCategoria(categoria: string): Observable<Repuesto[]> {
    return this.api.get<Repuesto[]>(`repuestos/categoria/${categoria}`);
  }
}
