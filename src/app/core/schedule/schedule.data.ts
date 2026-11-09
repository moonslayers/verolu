import type { Lesson, Period, PeriodId, Room } from './schedule.model';

export const PERIODS: readonly Period[] = [
  { id: 'm4', label: '4ta hora', start: '09:15', end: '10:00', shift: 'morning' },
  { id: 'm5', label: '5ta hora', start: '10:30', end: '11:10', shift: 'morning' },
  { id: 't1', label: '1ra hora', start: '13:00', end: '13:45', shift: 'afternoon' },
  { id: 't2', label: '2da hora', start: '13:45', end: '14:30', shift: 'afternoon' },
  { id: 't3', label: '3ra hora', start: '14:30', end: '15:15', shift: 'afternoon' },
  { id: 't4', label: '4ta hora', start: '15:15', end: '16:00', shift: 'afternoon' },
  { id: 't5', label: '5ta hora', start: '16:20', end: '17:05', shift: 'afternoon' },
  { id: 't6', label: '6ta hora', start: '17:05', end: '17:50', shift: 'afternoon' },
  { id: 't7', label: '7ma hora', start: '17:50', end: '18:35', shift: 'afternoon' },
] as const;

export const ROOMS: readonly Room[] = ['2C', '2D', '2E', '2F', '2G', '3A', '3B', '3G'] as const;

export const PERIOD_BY_ID: ReadonlyMap<PeriodId, Period> = new Map(
  PERIODS.map((p) => [p.id, p] as const),
);

const SUBJECT = 'Informática' as const;

export const LESSONS: readonly Lesson[] = [
  { periodId: 'm5', weekday: 1, room: '2E', subject: SUBJECT },
  { periodId: 't1', weekday: 1, room: '2G', subject: SUBJECT },
  { periodId: 't3', weekday: 1, room: '3A', subject: SUBJECT },
  { periodId: 't5', weekday: 1, room: '2D', subject: SUBJECT },
  { periodId: 't6', weekday: 1, room: '3G', subject: SUBJECT },
  { periodId: 't7', weekday: 1, room: '3B', subject: SUBJECT },
  { periodId: 'm5', weekday: 2, room: '2F', subject: SUBJECT },
  { periodId: 't5', weekday: 2, room: '2D', subject: SUBJECT },
  { periodId: 't6', weekday: 2, room: '2C', subject: SUBJECT },
  { periodId: 't7', weekday: 2, room: '2G', subject: SUBJECT },
  { periodId: 'm5', weekday: 3, room: '2E', subject: SUBJECT },
  { periodId: 't4', weekday: 3, room: '2G', subject: SUBJECT },
  { periodId: 't5', weekday: 3, room: '3A', subject: SUBJECT },
  { periodId: 't6', weekday: 3, room: '3G', subject: SUBJECT },
  { periodId: 't7', weekday: 3, room: '3B', subject: SUBJECT },
  { periodId: 'm4', weekday: 4, room: '2F', subject: SUBJECT },
  { periodId: 'm5', weekday: 4, room: '2E', subject: SUBJECT },
  { periodId: 't3', weekday: 4, room: '3B', subject: SUBJECT },
  { periodId: 't4', weekday: 4, room: '2D', subject: SUBJECT },
  { periodId: 't5', weekday: 4, room: '3G', subject: SUBJECT },
  { periodId: 't6', weekday: 4, room: '2C', subject: SUBJECT },
  { periodId: 'm5', weekday: 5, room: '2F', subject: SUBJECT },
  { periodId: 't2', weekday: 5, room: '2C', subject: SUBJECT },
  { periodId: 't3', weekday: 5, room: '3G', subject: SUBJECT },
  { periodId: 't7', weekday: 5, room: '3A', subject: SUBJECT },
] as const;
