import { describe, it, expect } from 'vitest';
import { LESSONS, PERIODS } from './schedule.data';
import {
  formatCountdown,
  formatDayLong,
  formatTimeRange,
  formatTimeShort,
  getCurrentLesson,
  getDayStatus,
  getDayStatusForLessons,
  getLessonsForWeekday,
  getNextLesson,
  getNextLessonToday,
  getPeriodById,
  getWeekday,
  isWeekend,
  minutesToTimeString,
  timeStringToMinutes,
  getMinutesSinceMidnight,
  minutesUntil,
} from './schedule.utils';
import type { Weekday } from './schedule.model';

function localDate(year: number, month: number, day: number, hh: number, mm: number): Date {
  return new Date(year, month - 1, day, hh, mm, 0, 0);
}

// 2026-11-09 lunes (getDay 1)
const MON = (hh: number, mm: number): Date => localDate(2026, 11, 9, hh, mm);
const TUE = (hh: number, mm: number): Date => localDate(2026, 11, 10, hh, mm);
const WED = (hh: number, mm: number): Date => localDate(2026, 11, 11, hh, mm);
const THU = (hh: number, mm: number): Date => localDate(2026, 11, 12, hh, mm);
const FRI = (hh: number, mm: number): Date => localDate(2026, 11, 13, hh, mm);
const SAT = (hh: number, mm: number): Date => localDate(2026, 11, 7, hh, mm);
const SUN = (hh: number, mm: number): Date => localDate(2026, 11, 8, hh, mm);

describe('schedule.utils — conversiones', () => {
  it('convierte HH:mm <-> minutos', () => {
    expect(timeStringToMinutes('09:15')).toBe(555);
    expect(timeStringToMinutes('13:00')).toBe(780);
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(minutesToTimeString(555)).toBe('09:15');
    expect(minutesToTimeString(0)).toBe('00:00');
    expect(minutesToTimeString(timeStringToMinutes('18:35'))).toBe('18:35');
  });

  it('valida estrictamente HH:mm', () => {
    for (const v of ['9:15', '25:00', '12:60', '', 'abc']) {
      expect(() => timeStringToMinutes(v)).toThrow();
    }
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('23:59')).toBe(23 * 60 + 59);
  });

  it('las 9 horas reales se convierten correctamente', () => {
    expect(timeStringToMinutes('09:15')).toBe(555);
    expect(timeStringToMinutes('10:30')).toBe(630);
    expect(timeStringToMinutes('13:00')).toBe(780);
    expect(timeStringToMinutes('13:45')).toBe(825);
    expect(timeStringToMinutes('14:30')).toBe(870);
    expect(timeStringToMinutes('15:15')).toBe(915);
    expect(timeStringToMinutes('16:00')).toBe(960);
    expect(timeStringToMinutes('16:20')).toBe(980);
    expect(timeStringToMinutes('17:05')).toBe(1025);
  });

  it('minutesUntil no produce NaN con entradas inválidas', () => {
    const d = new Date(2026, 10, 9, 10, 0);
    expect(Number.isNaN(minutesUntil(d, NaN))).toBe(false);
    expect(minutesUntil(d, NaN)).toBe(0);
    expect(Number.isNaN(minutesUntil(new Date(NaN), 100))).toBe(false);
  });

  it('getMinutesSinceMidnight usa hora local', () => {
    expect(getMinutesSinceMidnight(MON(9, 15))).toBe(555);
    expect(getMinutesSinceMidnight(FRI(18, 35))).toBe(1115);
  });

  it('getWeekday mapea lunes=1..viernes=5', () => {
    expect(getWeekday(MON(10, 0))).toBe(1);
    expect(getWeekday(TUE(10, 0))).toBe(2);
    expect(getWeekday(WED(10, 0))).toBe(3);
    expect(getWeekday(THU(10, 0))).toBe(4);
    expect(getWeekday(FRI(10, 0))).toBe(5);
    expect(getWeekday(SAT(10, 0))).toBeNull();
    expect(getWeekday(SUN(10, 0))).toBeNull();
  });

  it('isWeekend', () => {
    expect(isWeekend(SAT(12, 0))).toBe(true);
    expect(isWeekend(SUN(12, 0))).toBe(true);
    expect(isWeekend(MON(12, 0))).toBe(false);
  });
});

describe('schedule.utils — estado del día (6 estados)', () => {
  it('in-class durante una lección', () => {
    expect(getDayStatus(MON(10, 30))).toBe('in-class');
    expect(getDayStatus(MON(11, 9))).toBe('in-class');
    expect(getDayStatus(MON(13, 22))).toBe('in-class');
  });

  it('break entre clases', () => {
    expect(getDayStatus(MON(14, 0))).toBe('break');
  });

  it('break — receso mañana 10:00-10:30', () => {
    expect(getDayStatus(THU(10, 10))).toBe('break');
    expect(getDayStatus(THU(10, 0))).toBe('break');
    expect(getDayStatus(THU(10, 29))).toBe('break');
  });

  it('break — receso tarde 16:00-16:20', () => {
    expect(getDayStatus(MON(16, 10))).toBe('break');
    expect(getDayStatus(THU(16, 10))).toBe('break');
  });

  it('before-first', () => {
    expect(getDayStatus(MON(8, 0))).toBe('before-first');
    expect(getDayStatus(THU(8, 0))).toBe('before-first');
    expect(getDayStatus(THU(9, 14))).toBe('before-first');
  });

  it('after-last', () => {
    expect(getDayStatus(MON(18, 35))).toBe('after-last');
    expect(getDayStatus(MON(19, 0))).toBe('after-last');
    expect(getDayStatus(FRI(18, 36))).toBe('after-last');
  });

  it('weekend sábado y domingo', () => {
    expect(getDayStatus(SAT(10, 0))).toBe('weekend');
    expect(getDayStatus(SUN(13, 0))).toBe('weekend');
  });

  it('no-classes (día sin lecciones)', () => {
    expect(getDayStatusForLessons(MON(10, 0), [])).toBe('no-classes');
    expect(getDayStatusForLessons(TUE(10, 0), [])).toBe('no-classes');
    expect(getDayStatus(MON(10, 30))).toBe('in-class');
  });
});

describe('schedule.utils — lección actual y progreso', () => {
  it('progreso 0 al inicio y aumenta', () => {
    const start = MON(10, 30);
    const mid = MON(10, 50);
    const endMinus1 = MON(11, 9);

    const cStart = getCurrentLesson(start);
    expect(cStart).not.toBeNull();
    expect(cStart?.progress).toBeCloseTo(0, 5);
    expect(cStart?.remainingMinutes).toBe(40);

    const cMid = getCurrentLesson(mid);
    expect(cMid?.progress).toBeCloseTo(0.5, 5);
    expect(cMid?.remainingMinutes).toBe(20);

    const cEnd = getCurrentLesson(endMinus1);
    expect(cEnd?.progress).toBeCloseTo(39 / 40, 5);
    expect(cEnd?.remainingMinutes).toBe(1);

    expect(getCurrentLesson(MON(12, 0))).toBeNull();
  });

  it('progreso de t1 (45 min) ejemplo', () => {
    const c = getCurrentLesson(MON(13, 15));
    expect(c?.period.id).toBe('t1');
    expect(c?.lesson.room).toBe('2G');
    expect(c?.progress).toBeCloseTo(15 / 45, 5);
    expect(c?.remainingMinutes).toBe(30);
  });
});

describe('schedule.utils — siguiente clase', () => {
  it('siguiente clase hoy', () => {
    const next = getNextLessonToday(MON(11, 15));
    expect(next?.periodId).toBe('t1');
    const next2 = getNextLessonToday(MON(13, 10));
    expect(next2?.periodId).toBe('t3');
  });

  it('siguiente clase cuando hoy ya no hay → mañana', () => {
    const next = getNextLesson(MON(19, 0));
    expect(next).not.toBeNull();
    expect(next?.weekday).toBe(2);
    expect(next?.lesson.periodId).toBe('m5');
    expect(next?.lesson.room).toBe('2F');
  });

  it('siguiente clase saltando de viernes a lunes', () => {
    const next = getNextLesson(FRI(19, 0));
    expect(next).not.toBeNull();
    expect(next?.weekday).toBe(1);
    expect(next?.lesson.periodId).toBe('m5');
    expect(next?.lesson.room).toBe('2E');
    expect(next?.date.getDate()).toBe(16);
    expect(next?.date.getDay()).toBe(1);
  });

  it('siguiente clase desde sábado salta a lunes', () => {
    const next = getNextLesson(SAT(10, 0));
    expect(next?.weekday).toBe(1);
    expect(next?.lesson.periodId).toBe('m5');
  });

  it('lista ordenada de lecciones por día', () => {
    const lunes = getLessonsForWeekday(1 as Weekday);
    expect(lunes.map((l) => l.periodId)).toEqual(['m5', 't1', 't3', 't5', 't6', 't7']);
    const jueves = getLessonsForWeekday(4 as Weekday);
    expect(jueves.map((l) => l.periodId)).toEqual(['m4', 'm5', 't3', 't4', 't5', 't6']);
  });
});

describe('schedule.utils — formateadores', () => {
  it('formatTimeRange', () => {
    const p = getPeriodById('m4');
    expect(formatTimeRange(p)).toBe('09:15 – 10:00');
  });

  it('formatDayLong en español', () => {
    expect(formatDayLong(MON(10, 0))).toBe('lunes 9 de noviembre');
    expect(formatDayLong(TUE(10, 0))).toBe('martes 10 de noviembre');
    expect(formatDayLong(SUN(10, 0))).toBe('domingo 8 de noviembre');
    expect(formatDayLong(SAT(10, 0))).toBe('sábado 7 de noviembre');
    expect(formatDayLong(WED(10, 0))).toBe('miércoles 11 de noviembre');
  });

  it('formatTimeShort', () => {
    expect(formatTimeShort(MON(9, 15))).toBe('09:15');
    expect(formatTimeShort(MON(13, 5))).toBe('13:05');
  });

  it('formatCountdown', () => {
    expect(formatCountdown(20)).toBe('en 20 min');
    expect(formatCountdown(0)).toBe('en 0 min');
    expect(formatCountdown(65)).toBe('en 1 h 05 min');
    expect(formatCountdown(60)).toBe('en 1 h 00 min');
    expect(formatCountdown(125)).toBe('en 2 h 05 min');
  });
});

describe('schedule — integridad', () => {
  it('existen 25 lecciones', () => {
    expect(LESSONS).toHaveLength(25);
  });

  it('PERIODS son 9 y sin solapamientos por día', () => {
    expect(PERIODS).toHaveLength(9);

    const sorted = [...PERIODS].sort((a, b) => timeStringToMinutes(a.start) - timeStringToMinutes(b.start));
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      expect(timeStringToMinutes(cur.start)).toBeGreaterThanOrEqual(timeStringToMinutes(prev.end));
    }

    for (const wd of [1, 2, 3, 4, 5] as Weekday[]) {
      const ls = getLessonsForWeekday(wd);
      const ids = ls.map((l) => l.periodId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('salones pertenecen al conjunto permitido', () => {
    const allowed = new Set(['2C', '2D', '2E', '2F', '2G', '3A', '3B', '3G']);
    for (const l of LESSONS) {
      expect(allowed.has(l.room)).toBe(true);
    }
  });

  it('subject constante Informática', () => {
    for (const l of LESSONS) {
      expect(l.subject).toBe('Informática');
    }
  });

  it('conteo por día coincide con especificación', () => {
    expect(getLessonsForWeekday(1 as Weekday)).toHaveLength(6);
    expect(getLessonsForWeekday(2 as Weekday)).toHaveLength(4);
    expect(getLessonsForWeekday(3 as Weekday)).toHaveLength(5);
    expect(getLessonsForWeekday(4 as Weekday)).toHaveLength(6);
    expect(getLessonsForWeekday(5 as Weekday)).toHaveLength(4);
  });
});
