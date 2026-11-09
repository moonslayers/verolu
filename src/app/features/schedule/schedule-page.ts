import { Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon/icon';
import { ClockService } from '../../core/schedule/clock.service';
import { PERIODS, LESSONS } from '../../core/schedule/schedule.data';
import {
  formatDayLong,
  formatTimeRange,
  getMinutesSinceMidnight,
  getWeekday,
  timeStringToMinutes,
} from '../../core/schedule/schedule.utils';
import type { Lesson, Period, PeriodId, Weekday } from '../../core/schedule/schedule.model';
import { getHighlightSegments, normalizeText } from './schedule-search';
import {
  buildExcelColumnWidths,
  buildExcelSheetData,
  buildPdfDefinition,
  getExcelSheetName,
} from './schedule-export';

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

const DAY_LETTER: Record<string, string> = {
  Lunes: 'L',
  Martes: 'M',
  'Miércoles': 'X',
  Jueves: 'J',
  Viernes: 'V',
};

@Component({
  selector: 'app-schedule-page',
  imports: [Icon],
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

      <!-- Toolbar: search + actions -->
      <div
        data-print="hide"
        class="flex flex-col gap-3 border border-divider bg-surface p-3 rounded-card md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-1 items-center gap-2 min-w-0">
          <label for="schedule-search" class="sr-only">Buscar en el horario</label>
          <div class="relative flex w-full max-w-[420px] items-center">
            <span
              class="pointer-events-none absolute left-3 text-foreground-muted"
              aria-hidden="true"
            >
              <app-icon name="search" [size]="16" />
            </span>
            <input
              id="schedule-search"
              type="search"
              [value]="query()"
              (input)="onQueryInput($event)"
              placeholder="Buscar salón, día o periodo"
              class="h-11 w-full rounded-[10px] border border-divider bg-surface-raised py-2 pl-9 pr-10 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              autocomplete="off"
            />
            @if (query()) {
              <button
                type="button"
                (click)="clearQuery()"
                class="absolute right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] text-foreground-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Limpiar búsqueda"
              >
                <app-icon name="x" [size]="16" />
              </button>
            }
          </div>
          <span role="status" aria-live="polite" class="sr-only">{{ statusText() }}</span>
          <span
            role="status"
            aria-live="polite"
            class="shrink-0 text-caption text-foreground-muted"
          >
            @if (query()) {
              {{ matchCount() }} {{ matchCount() === 1 ? 'coincidencia' : 'coincidencias' }}
            }
          </span>
        </div>

        <div
          class="inline-flex overflow-hidden rounded-[10px] border border-divider divide-x divide-divider self-start md:self-auto"
        >
          <button
            type="button"
            (click)="exportPdf()"
            [disabled]="isExporting()"
            [attr.aria-busy]="isExporting() && exportKind() === 'pdf'"
            class="inline-flex min-h-11 items-center justify-center gap-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:opacity-60"
            aria-label="Exportar a PDF"
          >
            <app-icon name="file-down" [size]="16" />
            <span>@if (isExporting() && exportKind() === 'pdf') { Generando… } @else { PDF }</span>
          </button>
          <button
            type="button"
            (click)="exportExcel()"
            [disabled]="isExporting()"
            [attr.aria-busy]="isExporting() && exportKind() === 'excel'"
            class="inline-flex min-h-11 items-center justify-center gap-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:opacity-60"
            aria-label="Exportar a Excel"
          >
            <app-icon name="file-spreadsheet" [size]="16" />
            <span
              >@if (isExporting() && exportKind() === 'excel') { Generando… } @else { Excel }</span
            >
          </button>
          <button
            type="button"
            (click)="printSchedule()"
            class="inline-flex min-h-11 items-center justify-center gap-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            aria-label="Imprimir horario"
          >
            <app-icon name="printer" [size]="16" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

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
        <!-- Desktop board -->
        <div
          class="hidden overflow-hidden rounded-card border border-divider bg-surface md:block print:block"
        >
          <div class="overflow-auto md:overflow-visible print:overflow-visible">
            <table
              class="w-full border-collapse text-center text-sm print:table-fixed"
            >
              <caption class="sr-only">
                Horario semanal de Informática, lunes a viernes por periodo
              </caption>
              <thead class="sticky top-0 z-10 bg-surface-muted">
                <tr class="border-b border-divider">
                  <th
                    scope="col"
                    class="min-w-[110px] border-r border-divider bg-surface-muted px-3 py-3 text-left font-numeric text-[11px] font-semibold uppercase tracking-widest text-foreground"
                  >
                    Hora
                  </th>
                  @for (day of weekdays; track day.weekday) {
                    @if (isToday(day.weekday)) {
                      <th
                        scope="col"
                        class="border border-accent/30 bg-accent/[0.08] px-2 py-3 text-center border-t-[3px] border-t-accent"
                      >
                        <span class="inline-flex flex-col items-center gap-1">
                          <span
                            class="inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-widest text-foreground"
                          >
                            @for (seg of highlightSegments(day.label, query()); track $index) {
                              @if (seg.isMatch) {
                                <mark
                                  class="rounded bg-amber-200 px-0.5 text-zinc-900 dark:bg-amber-300 dark:text-zinc-900"
                                  >{{ seg.text }}</mark
                                >
                              } @else {
                                <span>{{ seg.text }}</span>
                              }
                            }
                          </span>
                          <span
                            class="inline-flex items-center rounded-pill bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-surface"
                            >Hoy</span
                          >
                        </span>
                      </th>
                    } @else {
                      <th
                        scope="col"
                        class="border border-divider bg-surface-muted px-2 py-3 text-center font-display text-[11px] font-semibold uppercase tracking-widest text-foreground"
                      >
                        <span class="inline-flex items-center gap-1">
                          @for (seg of highlightSegments(day.label, query()); track $index) {
                            @if (seg.isMatch) {
                              <mark
                                class="rounded bg-amber-200 px-0.5 text-zinc-900 dark:bg-amber-300 dark:text-zinc-900"
                                >{{ seg.text }}</mark
                              >
                            } @else {
                              <span>{{ seg.text }}</span>
                            }
                          }
                        </span>
                      </th>
                    }
                  }
                </tr>
              </thead>
              <tbody>
                @for (period of periods; track period.id) {
                  @if (period.id === 'm4') {
                    <tr class="border-y border-divider bg-surface-muted">
                      <td colspan="6" class="px-3 py-2 text-left">
                        <span
                          class="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
                        >
                          <span class="h-3 w-1 rounded-full bg-shift-morning"></span> Mañana
                        </span>
                      </td>
                    </tr>
                  }
                  @if (period.id === 't1') {
                    <tr class="border-y border-divider bg-surface-muted">
                      <td colspan="6" class="px-3 py-2 text-left">
                        <span
                          class="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
                        >
                          <span class="h-3 w-1 rounded-full bg-shift-afternoon"></span> Tarde
                        </span>
                      </td>
                    </tr>
                  }
                  <tr
                    class="border-t border-divider"
                    [style.background-color]="
                      isCurrentPeriod(period.id) ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : ''
                    "
                  >
                    @if (period.shift === 'morning') {
                      <th
                        scope="row"
                        class="border-r border-divider bg-surface-muted px-3 py-3 text-left align-top border-l-[3px] border-l-shift-morning"
                        [style.background-color]="
                          isCurrentPeriod(period.id) ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : ''
                        "
                        [class.border-l-accent]="isCurrentPeriod(period.id)"
                      >
                        <div class="flex items-center gap-2">
                          <span class="font-numeric text-sm font-bold text-foreground">
                            {{ period.label }}
                          </span>
                          @if (isCurrentPeriod(period.id)) {
                            <span
                              class="inline-flex items-center rounded-pill bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-surface"
                              >Ahora</span
                            >
                          }
                        </div>
                        <div class="font-numeric text-xs text-foreground-muted">
                          {{ period.start }} – {{ period.end }}
                        </div>
                      </th>
                    } @else {
                      <th
                        scope="row"
                        class="border-r border-divider bg-surface-muted px-3 py-3 text-left align-top border-l-[3px] border-l-shift-afternoon"
                        [style.background-color]="
                          isCurrentPeriod(period.id) ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : ''
                        "
                        [class.border-l-accent]="isCurrentPeriod(period.id)"
                      >
                        <div class="flex items-center gap-2">
                          <span class="font-numeric text-sm font-bold text-foreground">
                            {{ period.label }}
                          </span>
                          @if (isCurrentPeriod(period.id)) {
                            <span
                              class="inline-flex items-center rounded-pill bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-surface"
                              >Ahora</span
                            >
                          }
                        </div>
                        <div class="font-numeric text-xs text-foreground-muted">
                          {{ period.start }} – {{ period.end }}
                        </div>
                      </th>
                    }
                    @for (day of weekdays; track day.weekday) {
                      @let lesson = lessonMap.get(keyFor(period.id, day.weekday));
                      @let todayCol = isToday(day.weekday);
                      @let currentRow = isCurrentPeriod(period.id);
                      @if (todayCol) {
                        <td
                          class="border border-accent/30 p-2 align-middle"
                          [style.background-color]="
                            !currentRow
                              ? 'color-mix(in srgb, var(--accent) 6%, transparent)'
                              : 'color-mix(in srgb, var(--accent) 12%, transparent)'
                          "
                        >
                          @if (lesson) {
                            <span
                              class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-divider bg-surface-raised px-2 py-1 font-numeric text-sm font-semibold text-foreground"
                              [class.ring-1]="isMatch(period, day, lesson)"
                              [class.ring-accent]="isMatch(period, day, lesson)"
                              [class.ring-2]="currentRow"
                              [style.box-shadow]="
                                currentRow ? '0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent)' : ''
                              "
                            >
                              @for (seg of highlightSegments(lesson.room, query()); track $index) {
                                @if (seg.isMatch) {
                                  <mark
                                    class="rounded bg-amber-200 px-0.5 text-zinc-900 dark:bg-amber-300 dark:text-zinc-900"
                                    >{{ seg.text }}</mark
                                  >
                                } @else {
                                  <span>{{ seg.text }}</span>
                                }
                              }
                            </span>
                          } @else {
                            <span
                              aria-label="Sin clase"
                              class="inline-flex min-h-11 min-w-11 items-center justify-center font-numeric text-sm text-foreground-muted"
                              >—</span
                            >
                          }
                        </td>
                      } @else {
                        <td
                          class="border border-divider p-2 align-middle"
                          [class.bg-surface]="!currentRow"
                          [style.background-color]="
                            currentRow ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : ''
                          "
                        >
                          @if (lesson) {
                            <span
                              class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-divider bg-surface-raised px-2 py-1 font-numeric text-sm font-semibold text-foreground"
                              [class.ring-1]="isMatch(period, day, lesson)"
                              [class.ring-accent]="isMatch(period, day, lesson)"
                            >
                              @for (seg of highlightSegments(lesson.room, query()); track $index) {
                                @if (seg.isMatch) {
                                  <mark
                                    class="rounded bg-amber-200 px-0.5 text-zinc-900 dark:bg-amber-300 dark:text-zinc-900"
                                    >{{ seg.text }}</mark
                                  >
                                } @else {
                                  <span>{{ seg.text }}</span>
                                }
                              }
                            </span>
                          } @else {
                            <span
                              aria-label="Sin clase"
                              class="inline-flex min-h-11 min-w-11 items-center justify-center font-numeric text-sm text-foreground-muted"
                              >—</span
                            >
                          }
                        </td>
                      }
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile board -->
        <div
          class="overflow-hidden rounded-card border border-divider bg-surface md:hidden print:hidden"
        >
          <!-- Sticky header HORA + L M X J V -->
          <div
            class="sticky top-0 z-10 grid grid-cols-[96px_1fr] border-b border-divider bg-surface-muted"
          >
            <div
              class="flex items-center justify-center border-r border-divider px-3 py-2.5 font-display text-[11px] font-semibold uppercase tracking-widest text-foreground"
            >
              Hora
            </div>
            <div class="grid grid-cols-5">
              @for (day of weekdays; track day.weekday) {
                <div
                  class="flex flex-col items-center justify-center gap-0.5 border-l border-divider px-1 py-2 text-center first:border-l-0"
                  [style.background-color]="
                    isToday(day.weekday) ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : ''
                  "
                  [class.border-t-[3px]]="isToday(day.weekday)"
                  [class.border-t-accent]="isToday(day.weekday)"
                >
                  <span
                    class="text-[11px] font-semibold uppercase tracking-widest"
                    [class.text-accent]="isToday(day.weekday)"
                    [class.text-foreground]="isToday(day.weekday)"
                    [class.text-foreground-muted]="!isToday(day.weekday)"
                    >{{ dayLetter(day.label) }}</span
                  >
                  @if (isToday(day.weekday)) {
                    <span
                      class="inline-flex items-center rounded-pill bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-surface"
                      >Hoy</span
                    >
                  }
                </div>
              }
            </div>
          </div>

          @for (period of periods; track period.id) {
            @if (period.id === 'm4') {
              <div
                class="flex items-center gap-2 border-y border-divider bg-surface-muted px-3 py-2"
              >
                <span class="h-3 w-1 rounded-full bg-shift-morning"></span>
                <span
                  class="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
                  >Mañana</span
                >
              </div>
            }
            @if (period.id === 't1') {
              <div
                class="flex items-center gap-2 border-y border-divider bg-surface-muted px-3 py-2"
              >
                <span class="h-3 w-1 rounded-full bg-shift-afternoon"></span>
                <span
                  class="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
                  >Tarde</span
                >
              </div>
            }
            <section
              class="flex border-t border-divider first:border-t-0"
              [style.background-color]="
                isCurrentPeriod(period.id) ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : ''
              "
            >
              @if (period.shift === 'morning') {
                <div
                  class="flex w-[96px] shrink-0 flex-col justify-center gap-1 border-r border-divider bg-surface-muted px-3 py-3 border-l-[3px] border-l-shift-morning"
                  [style.background-color]="
                    isCurrentPeriod(period.id) ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : ''
                  "
                  [class.border-l-accent]="isCurrentPeriod(period.id)"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="font-numeric text-sm font-bold text-foreground">
                      {{ period.label }}
                    </span>
                    @if (isCurrentPeriod(period.id)) {
                      <span
                        class="inline-flex items-center rounded-pill bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-surface"
                        >Ahora</span
                      >
                    }
                  </div>
                  <div class="font-numeric text-xs leading-none text-foreground-muted">
                    {{ period.start }}
                  </div>
                  <div class="font-numeric text-xs leading-none text-foreground-muted">
                    {{ period.end }}
                  </div>
                </div>
              } @else {
                <div
                  class="flex w-[96px] shrink-0 flex-col justify-center gap-1 border-r border-divider bg-surface-muted px-3 py-3 border-l-[3px] border-l-shift-afternoon"
                  [style.background-color]="
                    isCurrentPeriod(period.id) ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : ''
                  "
                  [class.border-l-accent]="isCurrentPeriod(period.id)"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="font-numeric text-sm font-bold text-foreground">
                      {{ period.label }}
                    </span>
                    @if (isCurrentPeriod(period.id)) {
                      <span
                        class="inline-flex items-center rounded-pill bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-surface"
                        >Ahora</span
                      >
                    }
                  </div>
                  <div class="font-numeric text-xs leading-none text-foreground-muted">
                    {{ period.start }}
                  </div>
                  <div class="font-numeric text-xs leading-none text-foreground-muted">
                    {{ period.end }}
                  </div>
                </div>
              }
              <div class="grid flex-1 grid-cols-5 gap-px bg-divider">
                @for (day of weekdays; track day.weekday) {
                  @let lesson = lessonMap.get(keyFor(period.id, day.weekday));
                  @let todayCell = isToday(day.weekday);
                  @let current = isCurrentPeriod(period.id);
                  <div
                    class="flex min-h-11 items-center justify-center px-1 py-2"
                    [class.bg-surface]="!todayCell && !current"
                    [style.background-color]="
                      todayCell && current
                        ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                        : todayCell && !current
                          ? 'color-mix(in srgb, var(--accent) 6%, transparent)'
                          : !todayCell && current
                            ? 'color-mix(in srgb, var(--accent) 4%, transparent)'
                            : ''
                    "
                  >
                    @if (lesson) {
                      <span
                        class="inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-[10px] border border-divider bg-surface-raised px-2 py-1 font-numeric text-sm font-semibold text-foreground"
                        [class.ring-1]="isMatch(period, day, lesson)"
                        [class.ring-accent]="isMatch(period, day, lesson)"
                        [class.ring-2]="current && todayCell"
                        [style.box-shadow]="
                          current && todayCell ? '0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent)' : ''
                        "
                      >
                        @for (seg of highlightSegments(lesson.room, query()); track $index) {
                          @if (seg.isMatch) {
                            <mark
                              class="rounded bg-amber-200 px-0.5 text-zinc-900 dark:bg-amber-300 dark:text-zinc-900"
                              >{{ seg.text }}</mark
                            >
                          } @else {
                            <span>{{ seg.text }}</span>
                          }
                        }
                      </span>
                    } @else {
                      <span
                        aria-label="Sin clase"
                        class="inline-flex min-h-11 min-w-[44px] items-center justify-center font-numeric text-sm text-foreground-muted"
                        >—</span
                      >
                    }
                  </div>
                }
              </div>
            </section>
          }
        </div>
      }
    </section>
  `,
})
export class SchedulePage {
  private readonly clock = inject(ClockService);

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
        const lesson = this.lessonMap.get(this.keyFor(p.id, d.weekday));
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

  keyFor(periodId: string, weekday: number): string {
    return `${periodId}-${weekday}`;
  }

  isToday(weekday: Weekday): boolean {
    return this.todayWeekday() === weekday;
  }

  isCurrentPeriod(periodId: PeriodId): boolean {
    return this.currentPeriodId() === periodId;
  }

  isMatch(period: Period, day: WeekdayInfo, lesson: Lesson | undefined): boolean {
    const q = this.normalizedQuery();
    if (!q) return false;
    const fields = [lesson?.room ?? '', day.label, period.label, lesson?.subject ?? 'Informática'];
    return fields.some((f) => normalizeText(f).includes(q));
  }

  highlightSegments(text: string, q: string): { text: string; isMatch: boolean }[] {
    return getHighlightSegments(text, q);
  }

  dayLetter(label: string): string {
    return DAY_LETTER[label] ?? label.charAt(0).toUpperCase();
  }

  onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.query.set(target?.value ?? '');
  }

  clearQuery(): void {
    this.query.set('');
  }

  clearExportError(): void {
    this.exportError.set(null);
  }

  printSchedule(): void {
    window.print();
  }

  async exportPdf(): Promise<void> {
    if (this.isExporting()) return;
    const active = document.activeElement as HTMLElement | null;
    this.isExporting.set(true);
    this.exportKind.set('pdf');
    this.exportError.set(null);
    try {
      const now = new Date();
      const { docDefinition } = buildPdfDefinition(PERIODS, LESSONS, now);
      const pdfMakeModule = (await import('pdfmake/build/pdfmake')) as unknown as {
        default?: { createPdf: (def: unknown) => { download: (n: string) => void } };
        createPdf?: (def: unknown) => { download: (n: string) => void };
      };
      await import('pdfmake/build/vfs_fonts');
      const pdfMake = (pdfMakeModule.default ?? pdfMakeModule) as {
        createPdf: (def: unknown) => { download: (n: string) => void };
      };
      if (!pdfMake.createPdf) throw new Error('pdfMake no disponible');
      pdfMake.createPdf(docDefinition).download('horario-veronica-luna.pdf');
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
      const sheetData = buildExcelSheetData(PERIODS, LESSONS) as unknown[][];
      const columns = buildExcelColumnWidths();
      const sheetName = getExcelSheetName();
      const mod = (await import('write-excel-file/browser')) as unknown as {
        default: (data: unknown[][], opts: unknown) => { toFile: (n: string) => Promise<void> };
      };
      const writeXlsxFile = mod.default;
      const styledData: unknown[][] = sheetData.map((row, rowIndex) =>
        (row as string[]).map((cell) => {
          if (rowIndex === 0) {
            return {
              value: cell,
              fontWeight: 'bold',
              backgroundColor: '#e3dccf',
              align: 'center' as const,
            };
          }
          return { value: cell, align: 'center' as const };
        }),
      );
      await writeXlsxFile(styledData as unknown[][], {
        columns,
        stickyRowsCount: 1,
        sheet: sheetName,
      }).toFile('horario-veronica-luna.xlsx');
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

  protected readonly formatTimeRange = formatTimeRange;
}
