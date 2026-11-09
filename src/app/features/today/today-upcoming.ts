import { Component, input } from '@angular/core';
import type { Lesson, Period } from '../../core/schedule/schedule.model';

export interface TodayUpcomingRow {
  readonly lesson: Lesson;
  readonly period: Period;
  readonly state: 'past' | 'now' | 'future';
}

@Component({
  selector: 'app-today-upcoming',
  host: {
    style: 'display: block',
  },
  template: `
    @if (rows().length > 0) {
      <section
        aria-labelledby="resto-title"
        class="overflow-hidden rounded-card border border-divider bg-surface"
      >
        <h2
          id="resto-title"
          class="border-b border-divider px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
        >
          Resto del día
        </h2>
        <ul class="divide-y divide-divider">
          @for (row of rows(); track row.period.id) {
            <li
              class="flex items-center gap-3 border-l-[3px] px-3 py-3"
              [class.border-shift-morning]="row.period.shift === 'morning'"
              [class.border-shift-afternoon]="row.period.shift === 'afternoon'"
              [class.bg-accent]="row.state === 'now'"
              [class.text-surface]="row.state === 'now'"
            >
              <time
                [attr.datetime]="row.period.start"
                class="whitespace-nowrap font-numeric text-body tabular-nums"
                [class.text-surface]="row.state === 'now'"
                [class.text-foreground-muted]="row.state === 'past'"
              >
                {{ row.period.start }}
              </time>
              <span
                class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest"
                [class.text-surface]="row.state === 'now'"
                [class.text-foreground-muted]="row.state === 'past'"
              >
                {{ row.period.label }}
              </span>
              <span
                class="inline-flex items-center whitespace-nowrap rounded-chip border px-2 py-0.5 font-numeric text-caption font-bold"
                [class.border-divider]="row.state !== 'now'"
                [class.bg-surface-raised]="row.state !== 'now'"
                [class.border-white]="row.state === 'now'"
                [class.bg-white]="row.state === 'now'"
                [class.text-accent]="row.state === 'now'"
                [class.dark:border-zinc-900]="row.state === 'now'"
                [class.dark:bg-zinc-900]="row.state === 'now'"
                [class.dark:text-white]="row.state === 'now'"
              >
                {{ row.lesson.room }}
              </span>
              <span class="ml-auto flex items-center gap-2 whitespace-nowrap text-caption">
                @if (row.state === 'now') {
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-pill border border-white bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-accent dark:border-zinc-900 dark:bg-zinc-900 dark:text-white"
                  >
                    Ahora
                  </span>
                } @else if (row.state === 'past') {
                  <span class="font-medium text-foreground-muted">Finalizada</span>
                } @else {
                  <span class="font-numeric tabular-nums text-foreground-muted">{{
                    row.period.end
                  }}</span>
                }
              </span>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class TodayUpcoming {
  readonly rows = input<TodayUpcomingRow[]>([]);
}
