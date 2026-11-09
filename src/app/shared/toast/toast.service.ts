import { DestroyRef, Service, inject, signal } from '@angular/core';
import type { ShowToastOptions, Toast } from './toast.model';

@Service()
export class ToastService {
  private readonly destroyRef = inject(DestroyRef);
  private counter = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clear();
    });
  }

  show(options: ShowToastOptions): number {
    const id = ++this.counter;
    const toast: Toast = {
      id,
      message: options.message,
      action: options.action,
      dismissible: options.dismissible ?? true,
      politeness: options.politeness ?? 'polite',
      durationMs: options.durationMs ?? 5000,
      variant: options.variant ?? 'neutral',
    };

    const current = this._toasts();
    let next = current;
    if (current.length >= 3) {
      const discardIndex = current.findIndex((t) => t.durationMs !== 0);
      if (discardIndex !== -1) {
        const toDiscard = current[discardIndex];
        this.cancelTimer(toDiscard.id);
        next = current.filter((t) => t.id !== toDiscard.id);
      }
    }

    this._toasts.set([...next, toast]);

    if (toast.durationMs !== 0) {
      const timer = setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.durationMs);
      this.timers.set(toast.id, timer);
    }

    return id;
  }

  dismiss(id: number): void {
    this.cancelTimer(id);
    const current = this._toasts();
    if (!current.some((t) => t.id === id)) {
      return;
    }
    this._toasts.set(current.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this._toasts.set([]);
  }

  private cancelTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
