import { Component, input } from '@angular/core';
import { formatCountdown } from '../../core/schedule/schedule.utils';
import type {
  CurrentLesson,
  DayStatus,
  Lesson,
  NextLesson,
  Period,
} from '../../core/schedule/schedule.model';

@Component({
  selector: 'app-today-hero',
  host: {
    style: 'display: block',
  },
  template: `
    <div class="overflow-hidden rounded-card border border-divider bg-surface-raised">
      <div class="grid divide-y divide-divider lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        @switch (status()) {
          @case ('in-class') {
            @if (current(); as cur) {
              <section aria-labelledby="ahora-title" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="ahora-title"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Ahora
                </h2>
                <p class="flex flex-wrap items-baseline gap-3">
                  <span
                    class="whitespace-nowrap font-numeric text-display font-bold leading-none tracking-tight tabular-nums md:text-[64px]"
                  >
                    <time [attr.datetime]="cur.period.start">{{ cur.period.start }}</time>
                    <span aria-hidden="true" class="mx-1 font-normal text-foreground-muted">–</span>
                    <time [attr.datetime]="cur.period.end">{{ cur.period.end }}</time>
                  </span>
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1.5 font-numeric text-h2 font-bold leading-none"
                  >
                    {{ cur.lesson.room }}
                  </span>
                </p>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ cur.period.label }} · {{ weekdayName(now()) }}
                </p>
                <p class="text-body font-medium">{{ cur.lesson.subject }}</p>
                <div class="mt-2 space-y-2">
                  <div
                    role="progressbar"
                    [attr.aria-valuenow]="progressPercent()"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    [attr.aria-label]="'Progreso de la clase ' + cur.period.label"
                    class="h-2 w-full overflow-hidden rounded-pill bg-divider"
                  >
                    <div
                      class="h-full bg-accent transition-[width] duration-200"
                      [style.width.%]="progressPercent()"
                    ></div>
                  </div>
                  <p class="font-numeric text-caption tabular-nums text-foreground-muted">
                    Termina en {{ remainingMinutes() }} min
                  </p>
                </div>
              </section>
              @if (nextToday(); as nt) {
                <section aria-labelledby="next-title" class="flex flex-col gap-3 p-5 md:p-6">
                  <h2
                    id="next-title"
                    class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                  >
                    Siguiente
                  </h2>
                  <p class="flex flex-wrap items-baseline gap-3">
                    <span
                      class="whitespace-nowrap font-numeric text-h1 font-bold leading-none tracking-tight tabular-nums"
                    >
                      <time [attr.datetime]="nt.period.start">{{ nt.period.start }}</time>
                    </span>
                    <span
                      class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1 font-numeric text-body font-bold leading-none"
                    >
                      {{ nt.lesson.room }}
                    </span>
                  </p>
                  <p
                    class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                  >
                    {{ nt.period.label }}
                  </p>
                  <p class="font-numeric text-caption tabular-nums text-foreground-muted">
                    {{ formatCountdownLabel(minutesUntilNext()!) }}
                  </p>
                  <p class="whitespace-nowrap text-caption text-foreground-muted">
                    <time [attr.datetime]="nt.period.start" class="font-numeric tabular-nums">{{
                      nt.period.start
                    }}</time>
                    <span aria-hidden="true"> – </span>
                    <time [attr.datetime]="nt.period.end" class="font-numeric tabular-nums">{{
                      nt.period.end
                    }}</time>
                  </p>
                </section>
              }
            }
          }
          @case ('break') {
            @if (nextToday(); as nt) {
              <section aria-labelledby="recreo-title" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="recreo-title"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Recreo
                </h2>
                <p
                  class="whitespace-nowrap font-numeric text-h1 font-bold leading-none tracking-tight tabular-nums text-foreground"
                >
                  {{ formatCountdownLabel(minutesUntilNext()!) }}
                </p>
                <p class="text-caption text-foreground-muted">
                  Siguiente {{ nt.period.label }} · {{ nt.lesson.subject }}
                </p>
              </section>
              <section aria-labelledby="next-title-break" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="next-title-break"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Siguiente
                </h2>
                <p class="flex flex-wrap items-baseline gap-3">
                  <span
                    class="whitespace-nowrap font-numeric text-h1 font-bold leading-none tracking-tight tabular-nums"
                  >
                    <time [attr.datetime]="nt.period.start">{{ nt.period.start }}</time>
                  </span>
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1 font-numeric text-body font-bold leading-none"
                  >
                    {{ nt.lesson.room }}
                  </span>
                </p>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ nt.period.label }}
                </p>
                <p class="text-body font-medium">{{ nt.lesson.subject }}</p>
                <p class="whitespace-nowrap text-caption text-foreground-muted">
                  <time [attr.datetime]="nt.period.start" class="font-numeric tabular-nums">{{
                    nt.period.start
                  }}</time>
                  <span aria-hidden="true"> – </span>
                  <time [attr.datetime]="nt.period.end" class="font-numeric tabular-nums">{{
                    nt.period.end
                  }}</time>
                </p>
              </section>
            }
          }
          @case ('before-first') {
            @if (nextToday(); as nt) {
              <section aria-labelledby="primera-title" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="primera-title"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Primera clase
                </h2>
                <p class="flex flex-wrap items-baseline gap-3">
                  <span
                    class="whitespace-nowrap font-numeric text-display font-bold leading-none tracking-tight tabular-nums md:text-[64px]"
                  >
                    <time [attr.datetime]="nt.period.start">{{ nt.period.start }}</time>
                  </span>
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1.5 font-numeric text-h2 font-bold leading-none"
                  >
                    {{ nt.lesson.room }}
                  </span>
                </p>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ nt.period.label }} · {{ weekdayName(now()) }}
                </p>
                <p class="text-body font-medium">{{ nt.lesson.subject }}</p>
                <p class="whitespace-nowrap text-caption text-foreground-muted">
                  <time [attr.datetime]="nt.period.start" class="font-numeric tabular-nums">{{
                    nt.period.start
                  }}</time>
                  <span aria-hidden="true"> – </span>
                  <time [attr.datetime]="nt.period.end" class="font-numeric tabular-nums">{{
                    nt.period.end
                  }}</time>
                </p>
              </section>
              <section aria-labelledby="resto-antes-title" class="flex flex-col overflow-hidden">
                <h2
                  id="resto-antes-title"
                  class="border-y border-divider px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-foreground-muted lg:border-y-0 lg:border-b"
                >
                  El resto del día
                </h2>
                @if (beforeFirstRest().length > 0) {
                  <ul class="divide-y divide-divider">
                    @for (row of beforeFirstRest(); track row.period.id) {
                      <li
                        class="flex items-center gap-3 border-l-[3px] px-3 py-3"
                        [class.border-shift-morning]="row.period.shift === 'morning'"
                        [class.border-shift-afternoon]="row.period.shift === 'afternoon'"
                      >
                        <time
                          [attr.datetime]="row.period.start"
                          class="whitespace-nowrap font-numeric text-body tabular-nums"
                        >
                          {{ row.period.start }}
                        </time>
                        <span
                          class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest"
                        >
                          {{ row.period.label }}
                        </span>
                        <span
                          class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                        >
                          {{ row.lesson.room }}
                        </span>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="px-4 py-6 text-caption text-foreground-muted">
                    Solo tienes esta clase hoy
                  </p>
                }
              </section>
            }
          }
          @case ('after-last') {
            @if (nextOverall(); as nxt) {
              <section aria-labelledby="proxima-title-after" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="proxima-title-after"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Próxima clase
                </h2>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ weekdayName(nxt.date) }} ·
                  {{ nxt.period.shift === 'morning' ? 'Mañana' : 'Tarde' }}
                </p>
                <p class="flex flex-wrap items-baseline gap-3">
                  <span
                    class="whitespace-nowrap font-numeric text-display font-bold leading-none tracking-tight tabular-nums md:text-[64px]"
                  >
                    <time [attr.datetime]="nxt.period.start">{{ nxt.period.start }}</time>
                  </span>
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1.5 font-numeric text-h2 font-bold leading-none"
                  >
                    {{ nxt.lesson.room }}
                  </span>
                </p>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ nxt.period.label }}
                </p>
                <p class="text-body font-medium">{{ nxt.lesson.subject }}</p>
                <p class="whitespace-nowrap text-caption text-foreground-muted">
                  <time [attr.datetime]="nxt.period.start" class="font-numeric tabular-nums">{{
                    nxt.period.start
                  }}</time>
                  <span aria-hidden="true"> – </span>
                  <time [attr.datetime]="nxt.period.end" class="font-numeric tabular-nums">{{
                    nxt.period.end
                  }}</time>
                </p>
              </section>
              <section aria-labelledby="next-day-title-after" class="flex flex-col overflow-hidden">
                <h2
                  id="next-day-title-after"
                  class="border-y border-divider px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-foreground-muted lg:border-y-0 lg:border-b"
                >
                  Horario {{ weekdayName(nxt.date) }}
                </h2>
                <ul class="divide-y divide-divider">
                  @for (row of nextDayLessons(); track row.period.id) {
                    <li
                      class="flex items-center gap-3 border-l-[3px] px-3 py-3"
                      [class.border-shift-morning]="row.period.shift === 'morning'"
                      [class.border-shift-afternoon]="row.period.shift === 'afternoon'"
                    >
                      <time
                        [attr.datetime]="row.period.start"
                        class="whitespace-nowrap font-numeric text-body tabular-nums"
                      >
                        {{ row.period.start }}
                      </time>
                      <span
                        class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest"
                      >
                        {{ row.period.label }}
                      </span>
                      <span
                        class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                      >
                        {{ row.lesson.room }}
                      </span>
                      <span
                        class="ml-auto whitespace-nowrap font-numeric text-caption tabular-nums text-foreground-muted"
                      >
                        {{ row.period.end }}
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          }
          @case ('weekend') {
            @if (nextOverall(); as nxt) {
              <section aria-labelledby="vacio-weekend-title" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="vacio-weekend-title"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Hoy no hay clases
                </h2>
                <h2
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Próxima clase
                </h2>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ weekdayName(nxt.date) }} ·
                  {{ nxt.period.shift === 'morning' ? 'Mañana' : 'Tarde' }}
                </p>
                <p class="flex flex-wrap items-baseline gap-3">
                  <span
                    class="whitespace-nowrap font-numeric text-display font-bold leading-none tracking-tight tabular-nums md:text-[64px]"
                  >
                    <time [attr.datetime]="nxt.period.start">{{ nxt.period.start }}</time>
                  </span>
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1.5 font-numeric text-h2 font-bold leading-none"
                  >
                    {{ nxt.lesson.room }}
                  </span>
                </p>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ nxt.period.label }}
                </p>
                <p class="text-body font-medium">{{ nxt.lesson.subject }}</p>
                <p class="whitespace-nowrap text-caption text-foreground-muted">
                  <time [attr.datetime]="nxt.period.start" class="font-numeric tabular-nums">{{
                    nxt.period.start
                  }}</time>
                  <span aria-hidden="true"> – </span>
                  <time [attr.datetime]="nxt.period.end" class="font-numeric tabular-nums">{{
                    nxt.period.end
                  }}</time>
                </p>
              </section>
              <section
                aria-labelledby="next-day-title-weekend"
                class="flex flex-col overflow-hidden"
              >
                <h2
                  id="next-day-title-weekend"
                  class="border-y border-divider px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-foreground-muted lg:border-y-0 lg:border-b"
                >
                  Horario {{ weekdayName(nxt.date) }}
                </h2>
                <ul class="divide-y divide-divider">
                  @for (row of nextDayLessons(); track row.period.id) {
                    <li
                      class="flex items-center gap-3 border-l-[3px] px-3 py-3"
                      [class.border-shift-morning]="row.period.shift === 'morning'"
                      [class.border-shift-afternoon]="row.period.shift === 'afternoon'"
                    >
                      <time
                        [attr.datetime]="row.period.start"
                        class="whitespace-nowrap font-numeric text-body tabular-nums"
                      >
                        {{ row.period.start }}
                      </time>
                      <span
                        class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest"
                      >
                        {{ row.period.label }}
                      </span>
                      <span
                        class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                      >
                        {{ row.lesson.room }}
                      </span>
                      <span
                        class="ml-auto whitespace-nowrap font-numeric text-caption tabular-nums text-foreground-muted"
                      >
                        {{ row.period.end }}
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          }
          @case ('no-classes') {
            @if (nextOverall(); as nxt) {
              <section aria-labelledby="vacio-nc-title" class="flex flex-col gap-3 p-5 md:p-6">
                <h2
                  id="vacio-nc-title"
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Hoy no hay clases
                </h2>
                <h2
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  Próxima clase
                </h2>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ weekdayName(nxt.date) }} ·
                  {{ nxt.period.shift === 'morning' ? 'Mañana' : 'Tarde' }}
                </p>
                <p class="flex flex-wrap items-baseline gap-3">
                  <span
                    class="whitespace-nowrap font-numeric text-display font-bold leading-none tracking-tight tabular-nums md:text-[64px]"
                  >
                    <time [attr.datetime]="nxt.period.start">{{ nxt.period.start }}</time>
                  </span>
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1.5 font-numeric text-h2 font-bold leading-none"
                  >
                    {{ nxt.lesson.room }}
                  </span>
                </p>
                <p
                  class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ nxt.period.label }}
                </p>
                <p class="text-body font-medium">{{ nxt.lesson.subject }}</p>
                <p class="whitespace-nowrap text-caption text-foreground-muted">
                  <time [attr.datetime]="nxt.period.start" class="font-numeric tabular-nums">{{
                    nxt.period.start
                  }}</time>
                  <span aria-hidden="true"> – </span>
                  <time [attr.datetime]="nxt.period.end" class="font-numeric tabular-nums">{{
                    nxt.period.end
                  }}</time>
                </p>
              </section>
              <section aria-labelledby="next-day-title-nc" class="flex flex-col overflow-hidden">
                <h2
                  id="next-day-title-nc"
                  class="border-y border-divider px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-foreground-muted lg:border-y-0 lg:border-b"
                >
                  Horario {{ weekdayName(nxt.date) }}
                </h2>
                <ul class="divide-y divide-divider">
                  @for (row of nextDayLessons(); track row.period.id) {
                    <li
                      class="flex items-center gap-3 border-l-[3px] px-3 py-3"
                      [class.border-shift-morning]="row.period.shift === 'morning'"
                      [class.border-shift-afternoon]="row.period.shift === 'afternoon'"
                    >
                      <time
                        [attr.datetime]="row.period.start"
                        class="whitespace-nowrap font-numeric text-body tabular-nums"
                      >
                        {{ row.period.start }}
                      </time>
                      <span
                        class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest"
                      >
                        {{ row.period.label }}
                      </span>
                      <span
                        class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                      >
                        {{ row.lesson.room }}
                      </span>
                      <span
                        class="ml-auto whitespace-nowrap font-numeric text-caption tabular-nums text-foreground-muted"
                      >
                        {{ row.period.end }}
                      </span>
                    </li>
                  }
                </ul>
              </section>
            }
          }
        }
      </div>
    </div>
  `,
})
export class TodayHero {
  readonly status = input.required<DayStatus>();
  readonly now = input.required<Date>();
  readonly current = input<CurrentLesson | null>(null);
  readonly nextToday = input<{ lesson: Lesson; period: Period } | null>(null);
  readonly nextOverall = input<NextLesson | null>(null);
  readonly nextDayLessons = input<{ lesson: Lesson; period: Period }[]>([]);
  readonly progressPercent = input<number>(0);
  readonly remainingMinutes = input<number>(0);
  readonly minutesUntilNext = input<number | null>(null);
  readonly beforeFirstRest = input<{ lesson: Lesson; period: Period }[]>([]);

  formatCountdownLabel(mins: number): string {
    return formatCountdown(mins);
  }

  weekdayName(date: Date): string {
    const names = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ] as const;
    return names[date.getDay()] ?? '';
  }
}
