import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClockService } from '../../core/schedule/clock.service';
import {
  formatCountdown,
  formatDayLong,
  getCurrentLesson,
  getDayStatus,
  getLessonsForWeekday,
  getNextLesson,
  getNextLessonToday,
  getPeriodById,
  getWeekday,
  minutesUntil,
  timeStringToMinutes,
} from '../../core/schedule/schedule.utils';
import type { NextLesson } from '../../core/schedule/schedule.model';

type RestoState = 'past' | 'now' | 'future';

interface RestoRow {
  readonly lesson: ReturnType<typeof getLessonsForWeekday>[number];
  readonly period: ReturnType<typeof getPeriodById>;
  readonly state: RestoState;
}

@Component({
  selector: 'app-today-page',
  imports: [RouterLink],
  template: `
    <section aria-labelledby="today-title" class="space-y-6">
      <!-- Franja superior -->
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

      <div aria-live="polite" aria-atomic="true" class="sr-only">{{ liveMessage() }}</div>

      <!-- Tablero principal -->
      <div class="overflow-hidden rounded-card border border-divider bg-surface-raised">
        <div class="grid divide-y divide-divider lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          @switch (status()) {
            @case ('in-class') {
              @if (current(); as cur) {
                <section aria-labelledby="ahora-title" class="flex flex-col gap-3 p-5 md:p-6">
                  <h2 id="ahora-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
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
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
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
                      <div class="h-full bg-accent transition-[width] duration-200" [style.width.%]="progressPercent()"></div>
                    </div>
                    <p class="font-numeric text-caption tabular-nums text-foreground-muted">
                      Termina en {{ remainingMinutes() }} min
                    </p>
                  </div>
                </section>
                @if (nextToday(); as nt) {
                  <section aria-labelledby="next-title" class="flex flex-col gap-3 p-5 md:p-6">
                    <h2 id="next-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                      Siguiente
                    </h2>
                    <p class="flex flex-wrap items-baseline gap-3">
                      <span class="whitespace-nowrap font-numeric text-h1 font-bold leading-none tracking-tight tabular-nums">
                        <time [attr.datetime]="nt.period.start">{{ nt.period.start }}</time>
                      </span>
                      <span
                        class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1 font-numeric text-body font-bold leading-none"
                      >
                        {{ nt.lesson.room }}
                      </span>
                    </p>
                    <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                      {{ nt.period.label }}
                    </p>
                    <p class="font-numeric text-caption tabular-nums text-foreground-muted">
                      {{ formatCountdownLabel(minutesUntilNext()!) }}
                    </p>
                    <p class="whitespace-nowrap text-caption text-foreground-muted">
                      <time [attr.datetime]="nt.period.start" class="font-numeric tabular-nums">{{ nt.period.start }}</time>
                      <span aria-hidden="true"> – </span>
                      <time [attr.datetime]="nt.period.end" class="font-numeric tabular-nums">{{ nt.period.end }}</time>
                    </p>
                  </section>
                }
              }
            }
            @case ('break') {
              @if (nextToday(); as nt) {
                <section aria-labelledby="recreo-title" class="flex flex-col gap-3 p-5 md:p-6">
                  <h2 id="recreo-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    Recreo
                  </h2>
                  <p
                    class="whitespace-nowrap font-numeric text-h1 font-bold leading-none tracking-tight tabular-nums text-foreground"
                  >
                    {{ formatCountdownLabel(minutesUntilNext()!) }}
                  </p>
                  <p class="text-caption text-foreground-muted">Siguiente {{ nt.period.label }} · {{ nt.lesson.subject }}</p>
                </section>
                <section aria-labelledby="next-title-break" class="flex flex-col gap-3 p-5 md:p-6">
                  <h2 id="next-title-break" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    Siguiente
                  </h2>
                  <p class="flex flex-wrap items-baseline gap-3">
                    <span class="whitespace-nowrap font-numeric text-h1 font-bold leading-none tracking-tight tabular-nums">
                      <time [attr.datetime]="nt.period.start">{{ nt.period.start }}</time>
                    </span>
                    <span
                      class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface px-3 py-1 font-numeric text-body font-bold leading-none"
                    >
                      {{ nt.lesson.room }}
                    </span>
                  </p>
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ nt.period.label }}
                  </p>
                  <p class="text-body font-medium">{{ nt.lesson.subject }}</p>
                  <p class="whitespace-nowrap text-caption text-foreground-muted">
                    <time [attr.datetime]="nt.period.start" class="font-numeric tabular-nums">{{ nt.period.start }}</time>
                    <span aria-hidden="true"> – </span>
                    <time [attr.datetime]="nt.period.end" class="font-numeric tabular-nums">{{ nt.period.end }}</time>
                  </p>
                </section>
              }
            }
            @case ('before-first') {
              @if (nextToday(); as nt) {
                <section aria-labelledby="primera-title" class="flex flex-col gap-3 p-5 md:p-6">
                  <h2 id="primera-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
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
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ nt.period.label }} · {{ weekdayName(now()) }}
                  </p>
                  <p class="text-body font-medium">{{ nt.lesson.subject }}</p>
                  <p class="whitespace-nowrap text-caption text-foreground-muted">
                    <time [attr.datetime]="nt.period.start" class="font-numeric tabular-nums">{{ nt.period.start }}</time>
                    <span aria-hidden="true"> – </span>
                    <time [attr.datetime]="nt.period.end" class="font-numeric tabular-nums">{{ nt.period.end }}</time>
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
                          <time [attr.datetime]="row.period.start" class="whitespace-nowrap font-numeric text-body tabular-nums">
                            {{ row.period.start }}
                          </time>
                          <span class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest">
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
                    <p class="px-4 py-6 text-caption text-foreground-muted">Solo tienes esta clase hoy</p>
                  }
                </section>
              }
            }
            @case ('after-last') {
              @if (nextOverall(); as nxt) {
                <section aria-labelledby="proxima-title-after" class="flex flex-col gap-3 p-5 md:p-6">
                  <h2 id="proxima-title-after" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    Próxima clase
                  </h2>
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ weekdayName(nxt.date) }} · {{ nxt.period.shift === 'morning' ? 'Mañana' : 'Tarde' }}
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
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ nxt.period.label }}
                  </p>
                  <p class="text-body font-medium">{{ nxt.lesson.subject }}</p>
                  <p class="whitespace-nowrap text-caption text-foreground-muted">
                    <time [attr.datetime]="nxt.period.start" class="font-numeric tabular-nums">{{ nxt.period.start }}</time>
                    <span aria-hidden="true"> – </span>
                    <time [attr.datetime]="nxt.period.end" class="font-numeric tabular-nums">{{ nxt.period.end }}</time>
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
                        <time [attr.datetime]="row.period.start" class="whitespace-nowrap font-numeric text-body tabular-nums">
                          {{ row.period.start }}
                        </time>
                        <span class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest">
                          {{ row.period.label }}
                        </span>
                        <span
                          class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                        >
                          {{ row.lesson.room }}
                        </span>
                        <span class="ml-auto whitespace-nowrap font-numeric text-caption tabular-nums text-foreground-muted">
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
                  <h2 id="vacio-weekend-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    Hoy no hay clases
                  </h2>
                  <h2 class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">Próxima clase</h2>
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ weekdayName(nxt.date) }} · {{ nxt.period.shift === 'morning' ? 'Mañana' : 'Tarde' }}
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
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ nxt.period.label }}
                  </p>
                  <p class="text-body font-medium">{{ nxt.lesson.subject }}</p>
                  <p class="whitespace-nowrap text-caption text-foreground-muted">
                    <time [attr.datetime]="nxt.period.start" class="font-numeric tabular-nums">{{ nxt.period.start }}</time>
                    <span aria-hidden="true"> – </span>
                    <time [attr.datetime]="nxt.period.end" class="font-numeric tabular-nums">{{ nxt.period.end }}</time>
                  </p>
                </section>
                <section aria-labelledby="next-day-title-weekend" class="flex flex-col overflow-hidden">
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
                        <time [attr.datetime]="row.period.start" class="whitespace-nowrap font-numeric text-body tabular-nums">
                          {{ row.period.start }}
                        </time>
                        <span class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest">
                          {{ row.period.label }}
                        </span>
                        <span
                          class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                        >
                          {{ row.lesson.room }}
                        </span>
                        <span class="ml-auto whitespace-nowrap font-numeric text-caption tabular-nums text-foreground-muted">
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
                  <h2 id="vacio-nc-title" class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    Hoy no hay clases
                  </h2>
                  <h2 class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">Próxima clase</h2>
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ weekdayName(nxt.date) }} · {{ nxt.period.shift === 'morning' ? 'Mañana' : 'Tarde' }}
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
                  <p class="text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
                    {{ nxt.period.label }}
                  </p>
                  <p class="text-body font-medium">{{ nxt.lesson.subject }}</p>
                  <p class="whitespace-nowrap text-caption text-foreground-muted">
                    <time [attr.datetime]="nxt.period.start" class="font-numeric tabular-nums">{{ nxt.period.start }}</time>
                    <span aria-hidden="true"> – </span>
                    <time [attr.datetime]="nxt.period.end" class="font-numeric tabular-nums">{{ nxt.period.end }}</time>
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
                        <time [attr.datetime]="row.period.start" class="whitespace-nowrap font-numeric text-body tabular-nums">
                          {{ row.period.start }}
                        </time>
                        <span class="whitespace-nowrap text-[12px] font-semibold uppercase tracking-widest">
                          {{ row.period.label }}
                        </span>
                        <span
                          class="inline-flex items-center whitespace-nowrap rounded-chip border border-divider bg-surface-raised px-2 py-0.5 font-numeric text-caption font-bold"
                        >
                          {{ row.lesson.room }}
                        </span>
                        <span class="ml-auto whitespace-nowrap font-numeric text-caption tabular-nums text-foreground-muted">
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

      @if (restoRows().length > 0) {
        <section aria-labelledby="resto-title" class="overflow-hidden rounded-card border border-divider bg-surface">
          <h2 id="resto-title" class="border-b border-divider px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-foreground-muted">
            Resto del día
          </h2>
          <ul class="divide-y divide-divider">
            @for (row of restoRows(); track row.period.id) {
              <li
                class="flex items-center gap-3 border-l-[3px] px-3 py-3"
                [class.border-shift-morning]="row.period.shift === 'morning'"
                [class.border-shift-afternoon]="row.period.shift === 'afternoon'"
                [class.bg-accent]="row.state === 'now'"
                [class.text-surface]="row.state === 'now'"
                [class.bg-foreground]="false"
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
                    <span class="font-numeric tabular-nums text-foreground-muted">{{ row.period.end }}</span>
                  }
                </span>
              </li>
            }
          </ul>
        </section>
      }
    </section>
  `,
})
export class TodayPage {
  private readonly clock = inject(ClockService);

  readonly now = computed(() => this.clock.now());

  readonly isoDate = computed(() => {
    const d = this.now();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  readonly dayLong = computed(() => formatDayLong(this.now()));

  readonly status = computed(() => getDayStatus(this.now()));

  readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'in-class':
        return 'En clase';
      case 'break':
        return 'Recreo';
      case 'before-first':
        return 'Antes de tu primera clase';
      case 'after-last':
        return 'Terminaste por hoy';
      case 'weekend':
        return 'Fin de semana';
      case 'no-classes':
        return 'Sin clases';
      default:
        return '';
    }
  });

  readonly current = computed(() => getCurrentLesson(this.now()));

  readonly lessonsToday = computed(() => {
    const w = getWeekday(this.now());
    if (w === null) return [];
    return getLessonsForWeekday(w);
  });

  readonly nextToday = computed(() => {
    const lesson = getNextLessonToday(this.now());
    if (!lesson) return null;
    return { lesson, period: getPeriodById(lesson.periodId) };
  });

  readonly nextOverall = computed<NextLesson | null>(() => getNextLesson(this.now()));

  readonly nextDayLessons = computed(() => {
    const nxt = this.nextOverall();
    if (!nxt) return [];
    const lessons = getLessonsForWeekday(nxt.weekday);
    return lessons.map((lesson) => ({ lesson, period: getPeriodById(lesson.periodId) }));
  });

  readonly progressPercent = computed(() => {
    const c = this.current();
    if (!c) return 0;
    return Math.round(c.progress * 100);
  });

  readonly remainingMinutes = computed(() => {
    const c = this.current();
    return c ? c.remainingMinutes : 0;
  });

  readonly minutesUntilNext = computed(() => {
    const nt = this.nextToday();
    if (!nt) return null;
    return minutesUntil(this.now(), timeStringToMinutes(nt.period.start));
  });

  readonly beforeFirstRest = computed(() => {
    if (this.status() !== 'before-first') return [];
    const nt = this.nextToday();
    if (!nt) return [];
    const lessons = this.lessonsToday();
    const idx = lessons.findIndex((l) => l.periodId === nt.lesson.periodId);
    if (idx === -1) return [];
    return lessons.slice(idx + 1).map((lesson) => ({ lesson, period: getPeriodById(lesson.periodId) }));
  });

  readonly restoRows = computed<RestoRow[]>(() => {
    const s = this.status();
    if (s === 'after-last' || s === 'weekend' || s === 'no-classes' || s === 'before-first') return [];
    const lessons = this.lessonsToday();
    if (lessons.length === 0) return [];
    const minutes = this.now().getHours() * 60 + this.now().getMinutes();
    const cur = this.current();
    const curId = cur?.period.id ?? null;
    return lessons.map((lesson) => {
      const period = getPeriodById(lesson.periodId);
      const endMins = timeStringToMinutes(period.end);
      let state: RestoState;
      if (curId !== null && lesson.periodId === curId) state = 'now';
      else if (endMins <= minutes) state = 'past';
      else state = 'future';
      return { lesson, period, state };
    });
  });

  readonly liveMessage = computed(() => {
    const s = this.status();
    const cur = this.current();
    const nt = this.nextToday();
    const nxt = this.nextOverall();
    switch (s) {
      case 'in-class':
        return cur ? `En clase ${cur.period.label} en salón ${cur.lesson.room}. Siguiente ${nt?.period.label ?? ''}` : 'En clase';
      case 'break':
        return nt ? `Recreo. Siguiente ${nt.period.label} a las ${nt.period.start} en salón ${nt.lesson.room}` : 'Recreo';
      case 'before-first':
        return nt ? `Tu primera clase es a las ${nt.period.start} en salón ${nt.lesson.room}` : 'Antes de la primera clase';
      case 'after-last':
        return nxt ? `Terminaste por hoy. Siguiente ${this.weekdayName(nxt.date)} a las ${nxt.period.start}` : 'Terminaste por hoy';
      case 'weekend':
        return nxt ? `Hoy no hay clases. Siguiente ${this.weekdayName(nxt.date)} a las ${nxt.period.start}` : 'Hoy no hay clases';
      case 'no-classes':
        return nxt ? `Hoy no hay clases. Siguiente ${this.weekdayName(nxt.date)} a las ${nxt.period.start}` : 'Hoy no hay clases';
      default:
        return '';
    }
  });

  formatCountdownLabel(mins: number): string {
    return formatCountdown(mins);
  }

  weekdayName(date: Date): string {
    const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
    return names[date.getDay()] ?? '';
  }
}
