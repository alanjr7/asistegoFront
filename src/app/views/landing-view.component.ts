import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-landing-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-view.component.html',
  styleUrls: ['./landing-view.component.css']
})
export class LandingViewComponent {
  state = inject(AppStateService);

  irALogin(): void {
    this.state.currentView.set('login');
  }
}
