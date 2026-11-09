import { Component, computed, inject, signal } from '@angular/core';
import { ClockService } from '../../core/schedule/clock.service';
import { PERIODS, LESSONS } from '../../core/schedule/schedule.data';
import {
  formatDayLong,
  getMinutesSinceMidnight,
  getWeekday,
  timeStringToMinutes,
} from '../../core/schedule/schedule.utils';
import type { Lesson, Period, PeriodId, Weekday } from '../../core/schedule/schedule.model';
import { normalizeText } from './schedule-search';
import { ScheduleToolbar } from './schedule-toolbar';
import { WeekTable } from './week-table';
import { WeekBoard } from './week-board';
import { ScheduleExportService } from './schedule-export.service';
import { keyFor } from './schedule-view.model';

interface WeekdayInfo {
  readonly weekday: Weekday;
  readonly label: string;
}

const WEEKDAYS: readonly WeekdayInfo[] = [
  { weekday: 1, label: 'Lunes' },
  { weekday: 2, label: 'Martes' },
  { weekday: 3, label: 'Miércoles' },
  { weekday: 4, label: 'Jueves' },
  { weekday: 5, label: 'Viernes' },
] as const;

@Component({
  selector: 'app-schedule-page',
  imports: [ScheduleToolbar, WeekTable, WeekBoard],
  template: `
    <section aria-labelledby="schedule-title" class="space-y-4">
      <header class="space-y-1">
        <h1 id="schedule-title" class="text-h1 font-semibold text-foreground">Horario</h1>
        <p class="text-body text-foreground-muted">
          Horario semanal de Informática · Prof. Verónica Luna Hernández
        </p>
      </header>

      <div class="hidden print:block border-b border-divider pb-3">
        <h2 class="text-center text-sm font-semibold text-foreground">
          Horario · Informática · Prof. Verónica Luna Hernández
        </h2>
        <p class="text-center text-caption text-foreground-muted">Generado el {{ printDate() }}</p>
      </div>

      <app-schedule-toolbar
        [query]="query()"
        [isExporting]="isExporting()"
        [exportKind]="exportKind()"
        [matchCount]="matchCount()"
        [statusText]="statusText()"
        (queryChange)="query.set($event)"
        (clearQuery)="clearQuery()"
        (exportPdf)="exportPdf()"
        (exportExcel)="exportExcel()"
      />

      @if (exportError()) {
        <div
          role="alert"
          class="flex items-center justify-between gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          <span>{{ exportError() }}</span>
          <button
            type="button"
            (click)="clearExportError()"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-red-300 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cerrar
          </button>
        </div>
      }

      @if (query() && matchCount() === 0) {
        <div class="rounded-card border border-divider bg-surface-muted p-6 text-center">
          <p class="text-body font-medium text-foreground">Sin coincidencias</p>
          <p class="mt-1 text-sm text-foreground-muted">
            No hay clases que coincidan con “{{ query() }}”.
          </p>
          <button
            type="button"
            (click)="clearQuery()"
            class="mt-3 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Limpiar búsqueda
          </button>
        </div>
      } @else {
        <app-week-table
          [periods]="periods"
          [weekdays]="weekdays"
          [lessonMap]="lessonMap"
          [todayWeekday]="todayWeekday()"
          [currentPeriodId]="currentPeriodId()"
          [query]="query()"
        />
        <app-week-board
          [periods]="periods"
          [weekdays]="weekdays"
          [lessonMap]="lessonMap"
          [todayWeekday]="todayWeekday()"
          [currentPeriodId]="currentPeriodId()"
          [query]="query()"
        />
      }
    </section>
  `,
})
export class SchedulePage {
  private readonly clock = inject(ClockService);
  private readonly exporter = inject(ScheduleExportService);

  readonly weekdays = WEEKDAYS;
  readonly periods: readonly Period[] = PERIODS;

  readonly lessonMap: ReadonlyMap<string, Lesson> = new Map(
    LESSONS.map((l) => [`${l.periodId}-${l.weekday}`, l]),
  );

  readonly query = signal('');
  readonly isExporting = signal(false);
  readonly exportKind = signal<'pdf' | 'excel' | null>(null);
  readonly exportError = signal<string | null>(null);

  readonly normalizedQuery = computed(() => normalizeText(this.query()));

  readonly todayWeekday = computed<Weekday | null>(() => getWeekday(this.clock.now()));

  readonly currentPeriodId = computed<PeriodId | null>(() => {
    const wd = this.todayWeekday();
    if (wd === null) return null;
    const now = this.clock.now();
    const mins = getMinutesSinceMidnight(now);
    for (const p of this.periods) {
      const s = timeStringToMinutes(p.start);
      const e = timeStringToMinutes(p.end);
      if (mins >= s && mins < e) return p.id;
    }
    return null;
  });

  readonly matchCount = computed(() => {
    const q = this.normalizedQuery();
    if (!q) return 0;
    let count = 0;
    for (const p of this.periods) {
      for (const d of this.weekdays) {
        const lesson = this.lessonMap.get(keyFor(p.id, d.weekday));
        const fields = [lesson?.room ?? '', d.label, p.label, lesson?.subject ?? 'Informática'];
        if (fields.some((f) => normalizeText(f).includes(q))) {
          if (lesson) {
            count += 1;
          }
        }
      }
    }
    return count;
  });

  readonly statusText = computed(() => {
    const q = this.query();
    if (!q) return 'Sin filtro';
    const c = this.matchCount();
    if (c === 0) return 'Sin coincidencias';
    return `${c} ${c === 1 ? 'coincidencia' : 'coincidencias'} para ${q}`;
  });

  readonly printDate = computed(() => formatDayLong(new Date()));

  clearQuery(): void {
    this.query.set('');
  }

  clearExportError(): void {
    this.exportError.set(null);
  }

  async exportPdf(): Promise<void> {
    if (this.isExporting()) return;
    const active = document.activeElement as HTMLElement | null;
    this.isExporting.set(true);
    this.exportKind.set('pdf');
    this.exportError.set(null);
    try {
      await this.exporter.exportPdf();
    } catch {
      this.exportError.set('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      this.isExporting.set(false);
      this.exportKind.set(null);
      queueMicrotask(() => {
        if (this.exportError()) {
          const closeBtn = document.querySelector('[role="alert"] button') as HTMLElement | null;
          try {
            closeBtn?.focus();
          } catch {
            // ignore
          }
        } else if (active && typeof active.focus === 'function') {
          try {
            active.focus();
          } catch {
            // ignore
          }
        }
      });
    }
  }

  async exportExcel(): Promise<void> {
    if (this.isExporting()) return;
    const active = document.activeElement as HTMLElement | null;
    this.isExporting.set(true);
    this.exportKind.set('excel');
    this.exportError.set(null);
    try {
      await this.exporter.exportExcel();
    } catch {
      this.exportError.set('No se pudo generar el Excel. Intenta de nuevo.');
    } finally {
      this.isExporting.set(false);
      this.exportKind.set(null);
      queueMicrotask(() => {
        if (this.exportError()) {
          const closeBtn = document.querySelector('[role="alert"] button') as HTMLElement | null;
          try {
            closeBtn?.focus();
          } catch {
            // ignore
          }
        } else if (active && typeof active.focus === 'function') {
          try {
            active.focus();
          } catch {
            // ignore
          }
        }
      });
    }
  }
}
