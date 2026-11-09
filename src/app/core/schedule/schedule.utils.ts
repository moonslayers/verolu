import { LESSONS, PERIOD_BY_ID } from './schedule.data';
import type { CurrentLesson, DayStatus, Lesson, NextLesson, Period, Weekday } from './schedule.model';

// ── Time conversion ─────────────────────────────────────────────────────────

export function timeStringToMinutes(time: string): number {
  const parts = time.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Date helpers (local wall time) ────────────────────────────────────────

export function getMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function getWeekday(date: Date): Weekday | null {
  const d = date.getDay();
  if (d === 1) return 1;
  if (d === 2) return 2;
  if (d === 3) return 3;
  if (d === 4) return 4;
  if (d === 5) return 5;
  return null;
}

// ── Period helpers ─────────────────────────────────────────────────────────

export function getPeriodById(id: string): Period {
  const p = PERIOD_BY_ID.get(id as never);
  if (!p) throw new Error(`Unknown period id: ${id}`);
  return p;
}

export function getLessonsForWeekday(weekday: Weekday): readonly Lesson[] {
  const filtered = LESSONS.filter((l) => l.weekday === weekday);
  return [...filtered].sort(
    (a, b) => timeStringToMinutes(getPeriodById(a.periodId).start) - timeStringToMinutes(getPeriodById(b.periodId).start),
  );
}

// ── Day status ─────────────────────────────────────────────────────────────

export function getDayStatusForLessons(date: Date, lessons: readonly Lesson[]): DayStatus {
  if (isWeekend(date)) return 'weekend';
  if (lessons.length === 0) return 'no-classes';

  const minutes = getMinutesSinceMidnight(date);
  const periods = lessons.map((l) => getPeriodById(l.periodId));

  const sorted = [...periods].sort(
    (a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start),
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return 'no-classes';

  const firstStart = timeStringToMinutes(first.start);
  const lastEnd = timeStringToMinutes(last.end);

  if (minutes < firstStart) return 'before-first';
  if (minutes >= lastEnd) return 'after-last';

  for (const p of sorted) {
    const s = timeStringToMinutes(p.start);
    const e = timeStringToMinutes(p.end);
    if (minutes >= s && minutes < e) return 'in-class';
  }

  return 'break';
}

export function getDayStatus(date: Date): DayStatus {
  if (isWeekend(date)) return 'weekend';

  const weekday = getWeekday(date);
  if (weekday === null) return 'weekend';

  const lessons = getLessonsForWeekday(weekday);
  return getDayStatusForLessons(date, lessons);
}

// ── Current / next helpers ─────────────────────────────────────────────────

export function getCurrentLesson(date: Date): CurrentLesson | null {
  const weekday = getWeekday(date);
  if (weekday === null) return null;

  const minutes = getMinutesSinceMidnight(date);
  const lessons = getLessonsForWeekday(weekday);

  for (const lesson of lessons) {
    const period = getPeriodById(lesson.periodId);
    const s = timeStringToMinutes(period.start);
    const e = timeStringToMinutes(period.end);
    if (minutes >= s && minutes < e) {
      const duration = e - s;
      const elapsed = minutes - s;
      const progress = duration === 0 ? 0 : elapsed / duration;
      const remainingMinutes = e - minutes;
      return { lesson, period, progress, remainingMinutes };
    }
  }
  return null;
}

export function getNextLessonToday(date: Date): Lesson | null {
  const weekday = getWeekday(date);
  if (weekday === null) return null;

  const minutes = getMinutesSinceMidnight(date);
  const lessons = getLessonsForWeekday(weekday);

  for (const lesson of lessons) {
    const period = getPeriodById(lesson.periodId);
    const s = timeStringToMinutes(period.start);
    if (s > minutes) return lesson;
  }
  return null;
}

export function getNextLesson(date: Date): NextLesson | null {
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    candidate.setHours(12, 0, 0, 0);

    const w = getWeekday(candidate);
    if (w === null) continue;

    const lessons = getLessonsForWeekday(w);
    if (lessons.length === 0) continue;

    if (offset === 0) {
      const minutes = getMinutesSinceMidnight(date);
      for (const lesson of lessons) {
        const period = getPeriodById(lesson.periodId);
        const s = timeStringToMinutes(period.start);
        if (s > minutes) {
          const d = new Date(date);
          d.setDate(date.getDate() + offset);
          const resultDate = new Date(d);
          resultDate.setHours(0, 0, 0, 0);
          return { lesson, period, date: resultDate, weekday: w };
        }
      }
      continue;
    }

    const first = lessons[0];
    if (!first) continue;
    const period = getPeriodById(first.periodId);
    const d = new Date(date);
    d.setDate(date.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return { lesson: first, period, date: d, weekday: w };
  }
  return null;
}

// ── Formatters (español) ───────────────────────────────────────────────────

export function formatTimeRange(period: Period): string {
  return `${period.start} – ${period.end}`;
}

export function formatDayLong(date: Date): string {
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ] as const;

  const wd = weekdays.at(date.getDay()) ?? '';
  const m = months.at(date.getMonth()) ?? '';
  return `${wd} ${date.getDate()} de ${m}`;
}

export function formatTimeShort(date: Date): string {
  return minutesToTimeString(getMinutesSinceMidnight(date));
}

export function formatCountdown(totalMinutes: number): string {
  const mins = Math.max(0, Math.floor(totalMinutes));
  if (mins < 60) return `en ${mins} min`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return `en ${h} h ${String(r).padStart(2, '0')} min`;
}

export function minutesUntil(date: Date, targetMinutes: number): number {
  return targetMinutes - getMinutesSinceMidnight(date);
}
