import { ApplicationRef, DestroyRef, Service, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import { filter, take } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { WINDOW, type PwaWindow } from './pwa-window';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const THROTTLE_MS = 60 * 1000;
const STABILITY_FALLBACK_MS = 30 * 1000;

@Service()
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly appRef = inject(ApplicationRef, { optional: true });
  private readonly toast = inject(ToastService);
  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly windowRef = inject(WINDOW, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private initialized = false;
  private lastCheckAt = 0;
  private readonly seenVersionHashes = new Set<string>();
  private unrecoverableShown = false;
  private reloadFailureToastShown = false;
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private stabilityTimeout: ReturnType<typeof setTimeout> | null = null;

  private visibilityHandler: ((event: unknown) => void) | null = null;
  private pageshowHandler: ((event: unknown) => void) | null = null;
  private onlineHandler: ((event: unknown) => void) | null = null;

  private versionSub: { unsubscribe: () => void } | null = null;
  private unrecoverableSub: { unsubscribe: () => void } | null = null;
  private stableSub: { unsubscribe: () => void } | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const sw = this.swUpdate;
    if (!sw || !sw.isEnabled) return;

    this.versionSub = sw.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        const hash = event.latestVersion.hash;
        if (this.seenVersionHashes.has(hash)) return;
        this.seenVersionHashes.add(hash);
        this.toast.show({
          message: 'Hay una nueva versión disponible.',
          action: { label: 'Actualizar', callback: () => void this.activateAndReload() },
          dismissible: true,
          politeness: 'polite',
          durationMs: 0,
          variant: 'neutral',
        });
      } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
        console.warn('Service worker version installation failed');
      }
    });

    this.unrecoverableSub = sw.unrecoverable.subscribe(() => {
      if (this.unrecoverableShown) return;
      this.unrecoverableShown = true;
      this.toast.show({
        message: 'La app se quedó desactualizada. Recarga para continuar.',
        action: { label: 'Recargar', callback: () => this.reload() },
        dismissible: false,
        politeness: 'assertive',
        durationMs: 0,
        variant: 'danger',
      });
    });

    const doc = this.resolveDocument();
    const win = this.resolveWindow();

    if (doc && typeof doc.addEventListener === 'function') {
      const handler = () => {
        const state = doc.visibilityState;
        if (state === 'visible') {
          void this.checkForUpdate();
        }
      };
      this.visibilityHandler = handler;
      doc.addEventListener('visibilitychange', handler);
    }

    if (win && typeof win.addEventListener === 'function') {
      const pageshow = () => {
        void this.checkForUpdate();
      };
      this.pageshowHandler = pageshow;
      win.addEventListener('pageshow', pageshow);

      const online = () => {
        void this.checkForUpdate();
      };
      this.onlineHandler = online;
      win.addEventListener('online', online);
    }

    if (this.appRef) {
      this.stableSub = this.appRef.isStable
        .pipe(
          filter((value: boolean) => value === true),
          take(1),
        )
        .subscribe(() => {
          if (this.stabilityTimeout !== null) {
            const win2 = this.resolveWindow();
            const clearTimeoutFn =
              win2?.clearTimeout ?? (typeof clearTimeout === 'function' ? clearTimeout : undefined);
            if (clearTimeoutFn) clearTimeoutFn(this.stabilityTimeout);
            this.stabilityTimeout = null;
          }
          this.startPeriodic();
        });

      const setTimeoutFn =
        win?.setTimeout ?? (typeof setTimeout === 'function' ? setTimeout : undefined);
      if (setTimeoutFn) {
        this.stabilityTimeout = setTimeoutFn(() => {
          this.stabilityTimeout = null;
          this.startPeriodic();
        }, STABILITY_FALLBACK_MS) as ReturnType<typeof setTimeout>;
      }
    }
  }

  async checkForUpdate(): Promise<void> {
    const sw = this.swUpdate;
    if (!sw || !sw.isEnabled) return;

    const now = Date.now();
    if (now - this.lastCheckAt < THROTTLE_MS) return;

    try {
      await sw.checkForUpdate();
      this.lastCheckAt = Date.now();
    } catch {
      // offline or failure: do not consume throttle window
    }
  }

  private startPeriodic(): void {
    if (this.periodicTimer !== null) return;
    const win = this.resolveWindow();
    const setIntervalFn =
      win?.setInterval ?? (typeof setInterval === 'function' ? setInterval : undefined);
    if (!setIntervalFn) return;
    this.periodicTimer = setIntervalFn(() => {
      void this.checkForUpdate();
    }, CHECK_INTERVAL_MS) as ReturnType<typeof setInterval>;
  }

  private async activateAndReload(): Promise<void> {
    const sw = this.swUpdate;
    if (sw && sw.isEnabled) {
      try {
        await sw.activateUpdate();
      } catch {
        // ignore
      }
    }
    this.reload();
  }

  private reload(): void {
    const win = this.resolveWindow();
    const reloadFn = win?.location?.reload;
    if (typeof reloadFn !== 'function') {
      this.showReloadFailureToast();
      return;
    }
    try {
      reloadFn.call(win?.location);
    } catch {
      this.showReloadFailureToast();
    }
  }

  private showReloadFailureToast(): void {
    if (this.reloadFailureToastShown) return;
    this.reloadFailureToastShown = true;
    this.toast.show({
      message: 'No se pudo recargar. Cierra y reabre la app.',
      dismissible: false,
      politeness: 'assertive',
      durationMs: 0,
      variant: 'danger',
    });
  }

  private resolveDocument(): Document | null {
    if (this.documentRef) return this.documentRef as Document;
    if (typeof document !== 'undefined') return document;
    return null;
  }

  private resolveWindow(): PwaWindow | null {
    if (this.windowRef) return this.windowRef;
    if (typeof window !== 'undefined') return window as unknown as PwaWindow;
    return null;
  }

  private cleanup(): void {
    const doc = this.resolveDocument();
    if (doc && this.visibilityHandler && typeof doc.removeEventListener === 'function') {
      doc.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    const win = this.resolveWindow();
    if (win && this.pageshowHandler && typeof win.removeEventListener === 'function') {
      win.removeEventListener('pageshow', this.pageshowHandler);
    }
    if (win && this.onlineHandler && typeof win.removeEventListener === 'function') {
      win.removeEventListener('online', this.onlineHandler);
    }
    this.visibilityHandler = null;
    this.pageshowHandler = null;
    this.onlineHandler = null;

    if (this.periodicTimer !== null) {
      const clearIntervalFn =
        win?.clearInterval ?? (typeof clearInterval === 'function' ? clearInterval : undefined);
      if (clearIntervalFn) clearIntervalFn(this.periodicTimer);
      this.periodicTimer = null;
    }

    if (this.stabilityTimeout !== null) {
      const clearTimeoutFn =
        win?.clearTimeout ?? (typeof clearTimeout === 'function' ? clearTimeout : undefined);
      if (clearTimeoutFn) clearTimeoutFn(this.stabilityTimeout);
      this.stabilityTimeout = null;
    }

    this.versionSub?.unsubscribe();
    this.unrecoverableSub?.unsubscribe();
    this.stableSub?.unsubscribe();
    this.versionSub = null;
    this.unrecoverableSub = null;
    this.stableSub = null;

    this.initialized = false;
  }
}

export default UpdateService;
