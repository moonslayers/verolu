import { Component, input, output } from '@angular/core';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-schedule-toolbar',
  imports: [Icon],
  template: `
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
              (click)="clearQuery.emit()"
              class="absolute right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] text-foreground-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Limpiar búsqueda"
            >
              <app-icon name="x" [size]="16" />
            </button>
          }
        </div>
        <span role="status" aria-live="polite" class="sr-only">{{ statusText() }}</span>
        <span role="status" aria-live="polite" class="shrink-0 text-caption text-foreground-muted">
          @if (query()) {
            {{ matchCount() }} {{ matchCount() === 1 ? 'coincidencia' : 'coincidencias' }}
          }
        </span>
      </div>

      <div
        class="flex w-full overflow-hidden rounded-[10px] border border-divider divide-x divide-divider md:w-auto md:inline-flex"
      >
        <button
          type="button"
          (click)="exportPdf.emit()"
          [disabled]="isExporting()"
          [attr.aria-busy]="isExporting() && exportKind() === 'pdf'"
          class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:opacity-60"
          aria-label="Exportar a PDF"
        >
          <app-icon name="file-down" [size]="16" />
          <span>
            @if (isExporting() && exportKind() === 'pdf') {
              Generando…
            } @else {
              PDF
            }
          </span>
        </button>
        <button
          type="button"
          (click)="exportExcel.emit()"
          [disabled]="isExporting()"
          [attr.aria-busy]="isExporting() && exportKind() === 'excel'"
          class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:opacity-60"
          aria-label="Exportar a Excel"
        >
          <app-icon name="file-spreadsheet" [size]="16" />
          <span>
            @if (isExporting() && exportKind() === 'excel') {
              Generando…
            } @else {
              Excel
            }
          </span>
        </button>
      </div>
    </div>
  `,
})
export class ScheduleToolbar {
  readonly query = input<string>('');
  readonly isExporting = input<boolean>(false);
  readonly exportKind = input<'pdf' | 'excel' | null>(null);
  readonly matchCount = input<number>(0);
  readonly statusText = input<string>('');

  readonly queryChange = output<string>();
  readonly clearQuery = output<void>();
  readonly exportPdf = output<void>();
  readonly exportExcel = output<void>();

  onQueryInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.queryChange.emit(target?.value ?? '');
  }
}
