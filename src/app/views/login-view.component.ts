import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
@Component({
  selector: 'app-login-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-view.component.html',
  styleUrls: ['./login-view.component.css'],
})
export class LoginViewComponent {
  state = inject(AppStateService);
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

  navigateToRegister() {
    this.state.currentView.set('register');
  }

  navigateToForgotPassword() {
    this.state.currentView.set('forgot-password');
  }
}
