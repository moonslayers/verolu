import { Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon/icon';
import { ThemeService } from '../../core/theme/theme.service';
import type { ThemePreference } from '../../core/theme/theme.model';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
  readonly description: string;
  readonly icon: 'sun' | 'moon' | 'monitor';
}

const APP_VERSION = '1.0';

@Component({
  selector: 'app-settings-page',
  imports: [Icon],
  template: `
    <section aria-labelledby="settings-title" class="space-y-6">
      <header class="space-y-1">
        <h1 id="settings-title" class="font-display text-h1 font-semibold leading-none tracking-tight text-foreground">
          Ajustes
        </h1>
        <p class="text-sm leading-5 text-foreground-muted">Sigue el tema de tu dispositivo.</p>
      </header>

      <section aria-labelledby="tema-heading" class="space-y-3">
        <div class="space-y-1">
          <h2 id="tema-heading" class="text-sm font-semibold uppercase tracking-wide text-foreground-muted">Tema</h2>
          <p id="tema-desc" class="text-sm leading-5 text-foreground-muted">Elige cómo se ve la aplicación.</p>
        </div>

        <fieldset aria-describedby="tema-desc tema-estado">
          <legend class="sr-only">Tema</legend>

          <div class="overflow-hidden rounded-card border border-divider divide-y divide-divider">
            @for (opt of options; track opt.value) {
              <label
                class="flex min-h-[44px] cursor-pointer items-center gap-3 border-l-4 px-3 py-3 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface hover:bg-surface-muted/60"
                [class.border-l-accent]="theme.preference() === opt.value"
                [class.bg-surface-raised]="theme.preference() === opt.value"
                [class.bg-surface]="theme.preference() !== opt.value"
                [class.border-l-transparent]="theme.preference() !== opt.value"
                [attr.data-selected]="theme.preference() === opt.value"
              >
                <span
                  class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-chip border"
                  [class.border-accent]="theme.preference() === opt.value"
                  [class.bg-surface-raised]="theme.preference() === opt.value"
                  [class.border-divider]="theme.preference() !== opt.value"
                  [class.bg-surface-muted]="theme.preference() !== opt.value"
                  aria-hidden="true"
                >
                  <app-icon [name]="opt.icon" [size]="20" />
                </span>

                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="text-sm font-semibold leading-none text-foreground">{{ opt.label }}</span>
                  <span class="text-caption leading-4 text-foreground-muted">{{ opt.description }}</span>
                </span>

                <span
                  class="hidden shrink-0 overflow-hidden rounded-chip border border-divider sm:block"
                  style="width: 86px;"
                  aria-hidden="true"
                >
                  @if (opt.value === 'light') {
                    <span class="block p-2" style="background:#faf7f0;">
                      <span class="block h-1.5 w-8 rounded-pill" style="background:#1c1917;"></span>
                      <span class="mt-1 block h-1 w-12 rounded-pill" style="background:#57534e; opacity:0.7;"></span>
                      <span class="mt-2 flex gap-1">
                        <span class="h-5 flex-1 rounded-chip border" style="background:#fffdf8; border-color:#e3dccf;">
                          <span class="mx-1 mt-1 block h-1 rounded-pill" style="background:#c2410c;"></span>
                          <span class="mx-1 mt-1 block h-1 w-5 rounded-pill" style="background:#0f766e;"></span>
                        </span>
                        <span class="h-5 flex-1 rounded-chip border" style="background:#fffdf8; border-color:#e3dccf;">
                          <span class="mx-1 mt-1 block h-1 rounded-pill" style="background:#b45309;"></span>
                        </span>
                      </span>
                    </span>
                  } @else if (opt.value === 'dark') {
                    <span class="block p-2" style="background:#141210;">
                      <span class="block h-1.5 w-8 rounded-pill" style="background:#f5f0e6;"></span>
                      <span class="mt-1 block h-1 w-12 rounded-pill" style="background:#b8afa0; opacity:0.8;"></span>
                      <span class="mt-2 flex gap-1">
                        <span class="h-5 flex-1 rounded-chip border" style="background:#26221e; border-color:#332e28;">
                          <span class="mx-1 mt-1 block h-1 rounded-pill" style="background:#fb923c;"></span>
                          <span class="mx-1 mt-1 block h-1 w-5 rounded-pill" style="background:#5eead4;"></span>
                        </span>
                        <span class="h-5 flex-1 rounded-chip border" style="background:#26221e; border-color:#332e28;">
                          <span class="mx-1 mt-1 block h-1 rounded-pill" style="background:#fcd34d;"></span>
                        </span>
                      </span>
                    </span>
                  } @else {
                    <span class="flex">
                      <span class="block flex-1 p-2" style="background:#faf7f0;">
                        <span class="block h-1.5 w-8 rounded-pill" style="background:#1c1917;"></span>
                        <span class="mt-1 block h-1 w-10 rounded-pill" style="background:#57534e; opacity:0.7;"></span>
                        <span class="mt-2 block h-5 rounded-chip border" style="background:#fffdf8; border-color:#e3dccf;">
                          <span class="mx-1 mt-1 block h-1 rounded-pill" style="background:#c2410c;"></span>
                        </span>
                      </span>
                      <span class="block flex-1 border-l p-2" style="background:#141210; border-color:#332e28;">
                        <span class="block h-1.5 w-8 rounded-pill" style="background:#f5f0e6;"></span>
                        <span class="mt-1 block h-1 w-10 rounded-pill" style="background:#b8afa0; opacity:0.8;"></span>
                        <span class="mt-2 block h-5 rounded-chip border" style="background:#26221e; border-color:#332e28;">
                          <span class="mx-1 mt-1 block h-1 rounded-pill" style="background:#fb923c;"></span>
                        </span>
                      </span>
                    </span>
                  }
                </span>

                <input
                  type="radio"
                  name="theme"
                  [value]="opt.value"
                  [checked]="theme.preference() === opt.value"
                  (change)="onSelect(opt.value)"
                  class="sr-only"
                  [attr.aria-label]="opt.label"
                />

                <span
                  data-testid="theme-indicator"
                  class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2"
                  [class.border-accent]="theme.preference() === opt.value"
                  [class.bg-accent]="theme.preference() === opt.value"
                  [class.text-surface]="theme.preference() === opt.value"
                  [class.border-divider]="theme.preference() !== opt.value"
                  [class.bg-surface]="theme.preference() !== opt.value"
                  [class.text-transparent]="theme.preference() !== opt.value"
                  aria-hidden="true"
                >
                  @if (theme.preference() === opt.value) {
                    <app-icon name="check" [size]="16" />
                  }
                </span>
              </label>
            }
          </div>
        </fieldset>

        <p id="tema-estado" class="text-sm leading-5 text-foreground-muted">
          {{ currentStateText() }}
        </p>

        @if (announcement()) {
          <p role="status" aria-live="polite" class="text-sm font-medium text-foreground">
            {{ announcement() }}
          </p>
        }
      </section>

      <section aria-labelledby="acerca-title" class="space-y-3">
        <h2 id="acerca-title" class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          <app-icon name="info" [size]="16" />
          <span>Acerca de</span>
        </h2>

        <div class="divide-y divide-divider border-y border-divider">
          <div class="flex min-h-[44px] items-center justify-between gap-4 py-3">
            <span class="text-sm text-foreground-muted">Aplicación</span>
            <span class="text-sm font-semibold text-foreground">Verolu</span>
          </div>
          <div class="flex min-h-[44px] flex-col justify-center gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span class="text-sm text-foreground-muted">Asignatura</span>
            <span class="text-sm font-medium text-foreground">Informática · Prof. Verónica Luna Hernández</span>
          </div>
          <div class="flex min-h-[44px] items-center justify-between gap-4 py-3">
            <span class="text-sm text-foreground-muted">Versión</span>
            <span class="font-numeric text-sm font-medium tabular-nums text-foreground">1.0</span>
            <span class="sr-only">Versión 1.0</span>
          </div>
          <div class="py-3">
            <p class="text-sm leading-6 text-foreground-muted">
              El horario se consulta sin conexión y puedes imprimirlo o exportarlo desde Horario.
            </p>
          </div>
        </div>
      </section>
    </section>
  `,
})
export class SettingsPage {
  readonly theme = inject(ThemeService);

  readonly appVersion = APP_VERSION;

  readonly announcement = signal<string>('');

  readonly options: readonly ThemeOption[] = [
    { value: 'light', label: 'Claro', description: 'Siempre claro', icon: 'sun' },
    { value: 'dark', label: 'Oscuro', description: 'Siempre oscuro', icon: 'moon' },
    { value: 'system', label: 'Sistema', description: 'Sigue el tema del dispositivo', icon: 'monitor' },
  ] as const;

  readonly currentStateText = computed(() => {
    const pref = this.theme.preference();
    const resolved = this.theme.resolvedTheme();
    const resolvedLabel = resolved === 'dark' ? 'oscuro' : 'claro';
    if (pref === 'system') return `Ahora: ${resolvedLabel}, según tu dispositivo`;
    return `Ahora: ${resolvedLabel}`;
  });

  onSelect(pref: ThemePreference): void {
    const label = this.options.find((o) => o.value === pref)?.label ?? pref;
    void this.theme.setPreference(pref);
    this.announcement.set(`Tema actualizado a ${label}`);
  }
}
