import { Component, input } from '@angular/core';
import type { Lesson, Period, PeriodId, Weekday } from '../../core/schedule/schedule.model';
import { getHighlightSegments } from './schedule-search';
import { dayLetter as dayLetterShared, keyFor as keyForShared, isMatch as isMatchShared } from './schedule-view.model';

@Component({
  selector: 'app-week-table',
  imports: [],
  template: `
    <div class="hidden overflow-hidden rounded-card border border-divider bg-surface md:block print:block">
      <div class="overflow-auto md:overflow-visible print:overflow-visible">
        <table class="w-full border-collapse text-center text-sm print:table-fixed">
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
              @for (day of weekdays(); track day.weekday) {
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
            @for (period of periods(); track period.id) {
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
                @for (day of weekdays(); track day.weekday) {
                  @let lesson = lessonMap().get(keyFor(period.id, day.weekday));
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
                          [class.ring-1]="isMatch(period, day, lesson, query())"
                          [class.ring-accent]="isMatch(period, day, lesson, query())"
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
                          [class.ring-1]="isMatch(period, day, lesson, query())"
                          [class.ring-accent]="isMatch(period, day, lesson, query())"
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
  `,
})
export class WeekTable {
  readonly periods = input.required<readonly Period[]>();
  readonly weekdays = input.required<readonly { weekday: Weekday; label: string }[]>();
  readonly lessonMap = input.required<ReadonlyMap<string, Lesson>>();
  readonly todayWeekday = input<Weekday | null>(null);
  readonly currentPeriodId = input<PeriodId | null>(null);
  readonly query = input<string>('');

  readonly keyFor = keyForShared;
  readonly highlightSegments = getHighlightSegments;
  readonly dayLetter = dayLetterShared;
  readonly isMatch = isMatchShared;

  isToday(weekday: Weekday): boolean {
    return this.todayWeekday() === weekday;
  }

  isCurrentPeriod(periodId: PeriodId): boolean {
    return this.currentPeriodId() === periodId;
  }
}
