import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BrandMark } from './shared/brand-mark/brand-mark';
import { Icon } from './shared/icon/icon';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark, Icon],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly isSettings = signal(this.router.url.includes('/ajustes'));

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.isSettings.set(e.urlAfterRedirects.includes('/ajustes'));
    });
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/hoy');
    }
  }
}
