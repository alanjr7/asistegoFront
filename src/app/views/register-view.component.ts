import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-register-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-view.component.html',
  styleUrls: ['./register-view.component.css'],
})
export class RegisterViewComponent {
  state = inject(AppStateService);
  nombre = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;
  passwordMismatch = false;

  async handleSubmit() {
    this.error = null;
    this.passwordMismatch = false;

    if (!this.nombre || !this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.passwordMismatch = true;
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    try {
      await this.state.register(this.nombre, this.email, this.password);
    } catch (e: any) {
      this.error = e.message || 'Error al crear la cuenta';
    } finally {
      this.loading = false;
    }
  }

  navigateToLogin() {
    this.state.currentView.set('login');
  }
}
