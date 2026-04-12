import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Cliente, ClienteCreate, ClienteUpdate, Servicio } from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private api = inject(ApiService);

  listar(): Observable<Cliente[]> {
    return this.api.get<Cliente[]>('clientes/');
  }

  obtener(id: string): Observable<Cliente> {
    return this.api.get<Cliente>(`clientes/${id}`);
  }

  crear(cliente: ClienteCreate): Observable<Cliente> {
    return this.api.post<Cliente>('clientes/', cliente);
  }

  actualizar(id: string, cliente: ClienteUpdate): Observable<Cliente> {
    return this.api.put<Cliente>(`clientes/${id}`, cliente);
  }

  eliminar(id: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`clientes/${id}`);
  }

  getServicios(id: string): Observable<Servicio[]> {
    return this.api.get<Servicio[]>(`clientes/${id}/servicios`);
  }
}
