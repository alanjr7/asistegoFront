import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password-view.component.html',
  styleUrls: ['./reset-password-view.component.css'],
})
export class ResetPasswordViewComponent {
  state = inject(AppStateService);
  authService = inject(AuthService);
  email = '';
  tempPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  async handleSubmit() {
    if (this.email && this.tempPassword && this.newPassword && this.confirmPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Las contraseñas no coinciden';
        return;
      }

      this.loading = true;
      this.error = null;
      this.success = null;
      try {
        await this.authService.resetPassword({
          email: this.email,
          temp_password: this.tempPassword,
          new_password: this.newPassword
        }).toPromise();
        this.success = 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.';
        this.email = '';
        this.tempPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      } catch (e: any) {
        this.error = e.message || 'Error al actualizar la contraseña';
      } finally {
        this.loading = false;
      }
    }
  }

  navigateToLogin() {
    this.state.currentView.set('login');
  }
}
