import { Component, inject, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-landing-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-view.component.html',
  styleUrls: ['./landing-view.component.css']
})
export class LandingViewComponent implements AfterViewInit, OnDestroy {
  state = inject(AppStateService);
  mobileMenuOpen = signal(false);
  private scrollObserver: IntersectionObserver | null = null;
  private headerScrollHandler: (() => void) | null = null;

  ngAfterViewInit(): void {
    this.initScrollReveal();
    this.initHeaderScroll();
  }

  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
    if (this.headerScrollHandler) {
      window.removeEventListener('scroll', this.headerScrollHandler);
    }
  }

  irALogin(): void {
    this.state.currentView.set('login');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  private initScrollReveal(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.scrollObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => this.scrollObserver?.observe(el));
  }

  private initHeaderScroll(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const header = document.querySelector('.landing-header');
    if (!header) return;

    this.headerScrollHandler = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', this.headerScrollHandler, { passive: true });
    this.headerScrollHandler();
  }
}
