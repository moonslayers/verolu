import { InjectionToken } from '@angular/core';

export interface PwaWindow {
  location?: {
    reload?: () => void;
  };
  addEventListener: (type: string, listener: (event: unknown) => void) => void;
  removeEventListener: (type: string, listener: (event: unknown) => void) => void;
  setTimeout?: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  setInterval?: (handler: () => void, timeout: number) => ReturnType<typeof setInterval>;
  clearInterval?: (id: ReturnType<typeof setInterval>) => void;
  clearTimeout?: (id: ReturnType<typeof setTimeout>) => void;
}

export const WINDOW = new InjectionToken<PwaWindow>('WINDOW', {
  providedIn: 'root',
  factory: () => {
    if (typeof window === 'undefined') {
      return {
        location: {},
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      } as PwaWindow;
    }
    return window as unknown as PwaWindow;
  },
});
