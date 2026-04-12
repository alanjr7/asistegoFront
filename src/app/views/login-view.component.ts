import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-view.component.html',
  styleUrls: ['./login-view.component.css'],
})
export class LoginViewComponent {
  state = inject(AppStateService);
  authService = inject(AuthService);
  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  error: string | null = null;

  async handleSubmit() {
    if (this.email && this.password) {
      this.loading = true;
      this.error = null;
      try {
        await this.state.login(this.email, this.password, this.rememberMe);
      } catch (e: any) {
        this.error = e.message || 'Error al iniciar sesión';
      } finally {
        this.loading = false;
      }
    }
  }

  async handleSocialLogin(provider: string) {
    this.loading = true;
    this.error = null;
    try {
      // Para OAuth, normalmente se abre una ventana popup
      // Aquí simulamos el flujo
      console.log(`Iniciando OAuth con ${provider}...`);

      // Llamar al endpoint de OAuth del backend
      const response = await this.authService.loginOAuth(provider).toPromise();

      if (response?.access_token) {
        // Guardar token y redirigir
        localStorage.setItem('token', response.access_token);
        this.state.login(response.email || '', '', false);
      }
    } catch (e: any) {
      this.error = `Error al iniciar sesión con ${provider}: ${e.message}`;
      console.error('OAuth error:', e);
    } finally {
      this.loading = false;
    }
  }

  navigateToRegister() {
    this.state.currentView.set('register');
  }
}
