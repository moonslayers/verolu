export type Shift = 'morning' | 'afternoon';

export type PeriodId = 'm4' | 'm5' | 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7';

export type Weekday = 1 | 2 | 3 | 4 | 5;

export type Room = '2C' | '2D' | '2E' | '2F' | '2G' | '3A' | '3B' | '3G';

export interface Period {
  readonly id: PeriodId;
  readonly label: string;
  readonly start: string;
  readonly end: string;
  readonly shift: Shift;
}

export interface Lesson {
  readonly periodId: PeriodId;
  readonly weekday: Weekday;
  readonly room: Room;
  readonly subject: 'Informática';
}

export type DayStatus = 'in-class' | 'break' | 'before-first' | 'after-last' | 'weekend' | 'no-classes';

export interface CurrentLesson {
  readonly lesson: Lesson;
  readonly period: Period;
  readonly progress: number;
  readonly remainingMinutes: number;
}

export interface NextLesson {
  readonly lesson: Lesson;
  readonly period: Period;
  readonly date: Date;
  readonly weekday: Weekday;
}
