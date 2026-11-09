import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideFileDown,
  LucideFileSpreadsheet,
  LucideInfo,
  LucideMonitor,
  LucideMoon,
  LucideSearch,
  LucideSettings,
  LucideSun,
  LucideX,
  provideLucideConfig,
  provideLucideIcons,
} from '@lucide/angular';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideLucideConfig({ color: 'currentColor', size: 20, strokeWidth: 1.75 }),
    provideLucideIcons(
      LucideSun,
      LucideMoon,
      LucideMonitor,
      LucideSearch,
      LucideX,
      LucideFileDown,
      LucideFileSpreadsheet,
      LucideSettings,
      LucideArrowLeft,
      LucideCheck,
      LucideInfo,
    ),
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const theme = inject(ThemeService);
      const init = theme.init().catch(() => undefined);
      const timeout = new Promise<void>((resolve) => {
        setTimeout(resolve, 400);
      });
      return Promise.race([init, timeout]).catch(() => undefined);
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
