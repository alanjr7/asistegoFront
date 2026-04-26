import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environment/environment';

interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message: string;
}

interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  message: string;
  user?: {
    nombre: string;
    email: string;
    rol: string;
  };
}

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordRequest {
  email: string;
  temp_password: string;
  new_password: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface OAuthResponse {
  access_token: string;
  token_type: string;
  email?: string;
  nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  loginOAuth(provider: string): Observable<OAuthResponse> {
    // En producción, esto abriría una ventana popup para OAuth
    // Por ahora, simulamos el flujo con el backend
    return this.http.get<OAuthResponse>(`${this.apiUrl}/auth/oauth/${provider}`)
      .pipe(
        tap(response => {
          if (response.access_token) {
            localStorage.setItem('token', response.access_token);
          }
        })
      );
  }

  register(credentials: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
          }
        })
      );
  }

  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.http.post<ChangePasswordResponse>(`${this.apiUrl}/auth/change-password`, data, { headers });
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/auth/reset-password`, data);
  }
}
