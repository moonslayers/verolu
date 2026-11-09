import { describe, it, expect } from 'vitest';
import { PERIODS, LESSONS } from '../../core/schedule/schedule.data';
import { createLessonMap, getScheduleRows, getWeekdayColumns, dayLetter, keyFor, isMatch } from './schedule-view.model';

describe('schedule-view.model', () => {
  it('crea lessonMap con 25 lecciones', () => {
    const map = createLessonMap(LESSONS);
    expect(map.size).toBe(25);
  });

  it('genera 9 filas y 5 columnas', () => {
    const map = createLessonMap(LESSONS);
    const rows = getScheduleRows({
      periods: PERIODS,
      weekdays: [
        { weekday: 1, label: 'Lunes' },
        { weekday: 2, label: 'Martes' },
        { weekday: 3, label: 'Miércoles' },
        { weekday: 4, label: 'Jueves' },
        { weekday: 5, label: 'Viernes' },
      ],
      lessonMap: map,
      todayWeekday: 1,
      currentPeriodId: 't3',
      query: '2f',
    });
    expect(rows.length).toBe(9);
    expect(rows[0].cells.length).toBe(5);
  });

  it('marca columna hoy y periodo actual', () => {
    const map = createLessonMap(LESSONS);
    const rows = getScheduleRows({
      periods: PERIODS,
      weekdays: [{ weekday: 1, label: 'Lunes' }],
      lessonMap: map,
      todayWeekday: 1,
      currentPeriodId: 't3',
      query: '',
    });
    const t3 = rows.find((r) => r.period.id === 't3')!;
    expect(t3.isCurrentPeriod).toBe(true);
    expect(t3.cells[0].isTodayColumn).toBe(true);
    expect(t3.cells[0].isCurrentPeriod).toBe(true);
  });

  it('dayLetter y keyFor', () => {
    expect(dayLetter('Miércoles')).toBe('X');
    expect(dayLetter('miércoles')).toBe('M');
    expect(keyFor('t3', 1)).toBe('t3-1');
  });

  it('isMatch compartido', () => {
    const period = { id: 't3', label: 'T3', shift: 'morning' } as never;
    const day = { weekday: 1, label: 'Lunes' } as never;
    const lesson = { room: '2F', subject: 'Informática' } as never;
    expect(isMatch(period, day, lesson, '2f')).toBe(true);
    expect(isMatch(period, day, lesson, 'zzz')).toBe(false);
    expect(isMatch(period, day, undefined, '')).toBe(false);
  });

  it('columnas weekday', () => {
    const cols = getWeekdayColumns(
      [{ weekday: 1, label: 'Lunes' }],
      1,
    );
    expect(cols[0].isToday).toBe(true);
    expect(cols[0].letter).toBe('L');
  });
});
