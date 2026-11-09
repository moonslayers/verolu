import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-today-status',
  imports: [RouterLink],
  host: {
    style: 'display: block',
  },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-4">
      <div class="min-w-0">
        <h1 id="today-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">Hoy</h1>
        <p class="mt-1 flex flex-wrap items-center gap-2 text-caption">
          <time [attr.datetime]="isoDate()" class="font-numeric tabular-nums">{{ dayLong() }}</time>
          <span aria-hidden="true" class="text-divider">·</span>
          <span class="font-medium">{{ statusLabel() }}</span>
        </p>
      </div>
      <a
        routerLink="/horario"
        class="inline-flex min-h-11 items-center gap-1 text-caption font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Ver semana <span aria-hidden="true">→</span>
      </a>
    </div>
  `,
})
export class TodayStatus {
  readonly isoDate = input.required<string>();
  readonly dayLong = input.required<string>();
  readonly statusLabel = input.required<string>();
}
