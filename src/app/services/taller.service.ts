import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Taller, TallerUpdate, StatsResponse } from '../models/types.model';

@Injectable({
  providedIn: 'root'
})
export class TallerService {
  private api = inject(ApiService);

  obtener(): Observable<Taller> {
    return this.api.get<Taller>('taller/');
  }

  actualizar(taller: TallerUpdate): Observable<Taller> {
    return this.api.put<Taller>('taller/', taller);
  }

  getStats(): Observable<StatsResponse> {
    return this.api.get<StatsResponse>('taller/stats');
  }
}
