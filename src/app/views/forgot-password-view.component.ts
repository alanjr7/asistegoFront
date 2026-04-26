import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password-view.component.html',
  styleUrls: ['./forgot-password-view.component.css'],
})
export class ForgotPasswordViewComponent {
  state = inject(AppStateService);
  authService = inject(AuthService);
  email = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  async handleSubmit() {
    if (this.email) {
      this.loading = true;
      this.error = null;
      this.success = null;
      try {
        await this.authService.forgotPassword(this.email).toPromise();
        this.success = 'Si el email está registrado, recibirás un correo con instrucciones';
        this.email = '';
      } catch (e: any) {
        this.error = e.message || 'Error al enviar el correo';
      } finally {
        this.loading = false;
      }
    }
  }

  navigateToLogin() {
    this.state.currentView.set('login');
  }

  navigateToResetPassword() {
    this.state.currentView.set('reset-password');
  }
}
