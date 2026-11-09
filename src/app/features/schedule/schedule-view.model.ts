import type { Lesson, Period, PeriodId, Weekday } from '../../core/schedule/schedule.model';
import { normalizeText, getHighlightSegments, isCellMatching } from './schedule-search';
import type { HighlightSegment } from './schedule-search';

export interface WeekdayColumn {
  readonly weekday: Weekday;
  readonly label: string;
  readonly letter: string;
  readonly isToday: boolean;
}

export interface ScheduleCell {
  readonly period: Period;
  readonly periodId: PeriodId;
  readonly weekday: Weekday;
  readonly lesson: Lesson | undefined;
  readonly room: string;
  readonly isTodayColumn: boolean;
  readonly isCurrentPeriod: boolean;
  readonly isMatch: boolean;
  readonly segments: readonly HighlightSegment[];
}

export interface ScheduleRow {
  readonly period: Period;
  readonly isCurrentPeriod: boolean;
  readonly cells: readonly ScheduleCell[];
}

export const DAY_LETTERS: Readonly<Record<string, string>> = {
  Lunes: 'L',
  Martes: 'M',
  'Miércoles': 'X',
  Jueves: 'J',
  Viernes: 'V',
} as const;

export function dayLetter(label: string): string {
  return DAY_LETTERS[label] ?? normalizeText(label).charAt(0).toUpperCase();
}

export function keyFor(periodId: PeriodId | string, weekday: Weekday | number): string {
  return `${periodId}-${weekday}`;
}

export function createLessonMap(lessons: readonly Lesson[]): ReadonlyMap<string, Lesson> {
  return new Map(lessons.map((l) => [keyFor(l.periodId, l.weekday), l]));
}

export function isTodayColumn(weekday: Weekday, todayWeekday: Weekday | null): boolean {
  return todayWeekday === weekday;
}

export function isCurrentPeriodRow(periodId: PeriodId, currentPeriodId: PeriodId | null): boolean {
  return currentPeriodId === periodId;
}

export function isMatch(
  period: Period,
  day: { readonly label: string },
  lesson: Lesson | undefined,
  query: string,
): boolean {
  return isCellMatching(
    {
      room: lesson?.room,
      dayLabel: day.label,
      periodLabel: period.label,
      subject: lesson?.subject ?? 'Informática',
    },
    normalizeText(query),
  );
}

export function getWeekdayColumns(
  weekdays: readonly { readonly weekday: Weekday; readonly label: string }[],
  todayWeekday: Weekday | null,
): readonly WeekdayColumn[] {
  return weekdays.map((d) => ({
    weekday: d.weekday,
    label: d.label,
    letter: dayLetter(d.label),
    isToday: isTodayColumn(d.weekday, todayWeekday),
  }));
}

export function getScheduleRows(params: {
  readonly periods: readonly Period[];
  readonly weekdays: readonly { readonly weekday: Weekday; readonly label: string }[];
  readonly lessonMap: ReadonlyMap<string, Lesson>;
  readonly todayWeekday: Weekday | null;
  readonly currentPeriodId: PeriodId | null;
  readonly query: string;
}): readonly ScheduleRow[] {
  const normalizedQuery = normalizeText(params.query);
  return params.periods.map((period) => ({
    period,
    isCurrentPeriod: isCurrentPeriodRow(period.id, params.currentPeriodId),
    cells: params.weekdays.map((day) => {
      const lesson = params.lessonMap.get(keyFor(period.id, day.weekday));
      const isTodayCol = isTodayColumn(day.weekday, params.todayWeekday);
      const isCurrent = isCurrentPeriodRow(period.id, params.currentPeriodId);
      const match = isCellMatching(
        {
          room: lesson?.room,
          dayLabel: day.label,
          periodLabel: period.label,
          subject: lesson?.subject ?? 'Informática',
        },
        normalizedQuery,
      );
      return {
        period,
        periodId: period.id,
        weekday: day.weekday,
        lesson,
        room: lesson?.room ?? '',
        isTodayColumn: isTodayCol,
        isCurrentPeriod: isCurrent,
        isMatch: match,
        segments: getHighlightSegments(lesson?.room ?? '', params.query),
      };
    }),
  }));
}

export { normalizeText, getHighlightSegments, isCellMatching } from './schedule-search';
export type { HighlightSegment } from './schedule-search';
