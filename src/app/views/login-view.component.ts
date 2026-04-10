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

  handleSubmit() {
    if (this.email && this.password) {
      this.state.login();
    }
  }

  handleSocialLogin(provider: string) {
    this.state.login();
  }
}
