import { Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ToastService } from './toast.service';
import type { Toast } from './toast.model';

@Component({
  selector: 'app-toast-outlet',
  imports: [NgTemplateOutlet],
  template: `
    <div
      class="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom)+12px)] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 pointer-events-none"
      data-print="hide"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        class="flex w-full max-w-md flex-col items-center gap-2"
      >
        @for (toast of politeToasts(); track toast.id) {
          <ng-container
            [ngTemplateOutlet]="toastCard"
            [ngTemplateOutletContext]="{ $implicit: toast }"
          />
        }
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="false"
        class="flex w-full max-w-md flex-col items-center gap-2"
      >
        @for (toast of assertiveToasts(); track toast.id) {
          <ng-container
            [ngTemplateOutlet]="toastCard"
            [ngTemplateOutletContext]="{ $implicit: toast }"
          />
        }
      </div>
      <ng-template #toastCard let-toast>
        <article [class]="cardClasses(toast)">
          <p class="text-body">{{ toast.message }}</p>
          @if (toast.action || toast.dismissible) {
            <div class="mt-2 flex items-center gap-2">
              @if (toast.action) {
                <button
                  type="button"
                  (click)="onAction(toast)"
                  class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] bg-accent px-3 text-sm font-medium text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {{ toast.action.label }}
                </button>
              }
              @if (toast.dismissible) {
                @if (toast.action) {
                  <button
                    type="button"
                    (click)="dismiss(toast.id)"
                    class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-divider px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Más tarde
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="dismiss(toast.id)"
                    aria-label="Cerrar"
                    class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-divider px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Cerrar
                  </button>
                }
              }
            </div>
          }
        </article>
      </ng-template>
    </div>
  `,
})
export class ToastOutlet {
  private readonly toastService = inject(ToastService);

  readonly politeToasts = computed(() =>
    this.toastService.toasts().filter((toast) => toast.politeness === 'polite'),
  );
  readonly assertiveToasts = computed(() =>
    this.toastService.toasts().filter((toast) => toast.politeness === 'assertive'),
  );

  cardClasses(toast: Toast): string {
    const base =
      'rounded-card border px-4 py-3 shadow-card text-body pointer-events-auto w-full max-w-md';
    if (toast.variant === 'danger') {
      return `${base} border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100`;
    }
    return `${base} border-divider bg-surface-raised text-foreground`;
  }

  onAction(toast: Toast): void {
    try {
      toast.action?.callback();
    } finally {
      this.toastService.dismiss(toast.id);
    }
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
