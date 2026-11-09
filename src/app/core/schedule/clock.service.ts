import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now = signal(new Date());

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const intervalId = setInterval(() => {
      this.now.set(new Date());
    }, 10_000);

    this.destroyRef.onDestroy(() => {
      clearInterval(intervalId);
    });
  }
}
