import { Component, input } from '@angular/core';
import type { Lesson, Period, PeriodId, Weekday } from '../../core/schedule/schedule.model';
import { getHighlightSegments } from './schedule-search';
import { dayLetter as dayLetterShared, keyFor as keyForShared, isMatch as isMatchShared } from './schedule-view.model';

@Component({
  selector: 'app-week-board',
  imports: [],
  template: `
    <div class="overflow-hidden rounded-card border border-divider bg-surface md:hidden print:hidden">
      <div class="sticky top-0 z-10 grid grid-cols-[96px_1fr] border-b border-divider bg-surface-muted">
        <div
          class="flex items-center justify-center border-r border-divider px-3 py-2.5 font-display text-[11px] font-semibold uppercase tracking-widest text-foreground"
        >
          Hora
        </div>
        <div class="grid grid-cols-5">
          @for (day of weekdays(); track day.weekday) {
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

      @for (period of periods(); track period.id) {
        @if (period.id === 'm4') {
          <div class="flex items-center gap-2 border-y border-divider bg-surface-muted px-3 py-2">
            <span class="h-3 w-1 rounded-full bg-shift-morning"></span>
            <span class="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
              >Mañana</span
            >
          </div>
        }
        @if (period.id === 't1') {
          <div class="flex items-center gap-2 border-y border-divider bg-surface-muted px-3 py-2">
            <span class="h-3 w-1 rounded-full bg-shift-afternoon"></span>
            <span class="text-[11px] font-semibold uppercase tracking-widest text-foreground-muted"
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
            @for (day of weekdays(); track day.weekday) {
              @let lesson = lessonMap().get(keyFor(period.id, day.weekday));
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
                    [class.ring-1]="isMatch(period, day, lesson, query())"
                    [class.ring-accent]="isMatch(period, day, lesson, query())"
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
  `,
})
export class WeekBoard {
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
