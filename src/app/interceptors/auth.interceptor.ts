import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AppStateService } from '../services/app-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const appState = inject(AppStateService);
  const token = localStorage.getItem('token');

  const authReq = token 
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // No cerrar sesión automáticamente si el error 401 viene del login o registro
      const isAuthPath = req.url.includes('/auth/login') || req.url.includes('/auth/register');
      
      if (error.status === 401 && !isAuthPath) {
        console.warn(`[AUTH] 401 Unauthorized en ${req.url}. Sesión cerrada automáticamente.`);
        appState.logout();
      }
      return throwError(() => error);
    })
  );
};
