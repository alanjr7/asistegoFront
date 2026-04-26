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
      if (error.status === 401) {
        appState.logout();
      }
      return throwError(() => error);
    })
  );
};
