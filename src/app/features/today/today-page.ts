import { Component, computed, inject } from '@angular/core';
import { ClockService } from '../../core/schedule/clock.service';
import {
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
import type { TodayUpcomingRow } from './today-upcoming';
import { TodayStatus } from './today-status';
import { TodayHero } from './today-hero';
import { TodayUpcoming } from './today-upcoming';

@Component({
  selector: 'app-today-page',
  imports: [TodayStatus, TodayHero, TodayUpcoming],
  template: `
    <section aria-labelledby="today-title" class="space-y-6">
      <app-today-status [isoDate]="isoDate()" [dayLong]="dayLong()" [statusLabel]="statusLabel()" />

      <div aria-live="polite" aria-atomic="true" class="sr-only">{{ liveMessage() }}</div>

      <app-today-hero
        [status]="status()"
        [now]="now()"
        [current]="current()"
        [nextToday]="nextToday()"
        [nextOverall]="nextOverall()"
        [nextDayLessons]="nextDayLessons()"
        [progressPercent]="progressPercent()"
        [remainingMinutes]="remainingMinutes()"
        [minutesUntilNext]="minutesUntilNext()"
        [beforeFirstRest]="beforeFirstRest()"
      />

      @if (restoRows().length > 0) {
        <app-today-upcoming [rows]="restoRows()" />
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
    return lessons
      .slice(idx + 1)
      .map((lesson) => ({ lesson, period: getPeriodById(lesson.periodId) }));
  });

  readonly restoRows = computed<TodayUpcomingRow[]>(() => {
    const s = this.status();
    if (s === 'after-last' || s === 'weekend' || s === 'no-classes' || s === 'before-first')
      return [];
    const lessons = this.lessonsToday();
    if (lessons.length === 0) return [];
    const minutes = this.now().getHours() * 60 + this.now().getMinutes();
    const cur = this.current();
    const curId = cur?.period.id ?? null;
    return lessons.map((lesson) => {
      const period = getPeriodById(lesson.periodId);
      const endMins = timeStringToMinutes(period.end);
      let state: TodayUpcomingRow['state'];
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
        return cur
          ? `En clase ${cur.period.label} en salón ${cur.lesson.room}. Siguiente ${nt?.period.label ?? ''}`
          : 'En clase';
      case 'break':
        return nt
          ? `Recreo. Siguiente ${nt.period.label} a las ${nt.period.start} en salón ${nt.lesson.room}`
          : 'Recreo';
      case 'before-first':
        return nt
          ? `Tu primera clase es a las ${nt.period.start} en salón ${nt.lesson.room}`
          : 'Antes de la primera clase';
      case 'after-last':
        return nxt
          ? `Terminaste por hoy. Siguiente ${this.weekdayName(nxt.date)} a las ${nxt.period.start}`
          : 'Terminaste por hoy';
      case 'weekend':
        return nxt
          ? `Hoy no hay clases. Siguiente ${this.weekdayName(nxt.date)} a las ${nxt.period.start}`
          : 'Hoy no hay clases';
      case 'no-classes':
        return nxt
          ? `Hoy no hay clases. Siguiente ${this.weekdayName(nxt.date)} a las ${nxt.period.start}`
          : 'Hoy no hay clases';
      default:
        return '';
    }
  });

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
