import { ApplicationRef, DestroyRef, Service, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import { filter, take } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { WINDOW, type PwaWindow } from './pwa-window';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const THROTTLE_MS = 60 * 1000;

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
  private periodicTimer: ReturnType<typeof setInterval> | null = null;

  private visibilityHandler: ((event: unknown) => void) | null = null;
  private pageshowHandler: ((event: unknown) => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanup());
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const sw = this.swUpdate;
    if (!sw || !sw.isEnabled) return;

    const versionSub = sw.versionUpdates.subscribe((event) => {
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

    const unrecoverableSub = sw.unrecoverable.subscribe(() => {
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
      const handler = () => {
        void this.checkForUpdate();
      };
      this.pageshowHandler = handler;
      win.addEventListener('pageshow', handler);
    }

    let stableSub: { unsubscribe: () => void } | null = null;
    if (this.appRef) {
      stableSub = this.appRef.isStable
        .pipe(
          filter((value: boolean) => value === true),
          take(1),
        )
        .subscribe(() => {
          this.startPeriodic();
        });
    }

    this.destroyRef.onDestroy(() => {
      versionSub.unsubscribe();
      unrecoverableSub.unsubscribe();
      stableSub?.unsubscribe();
    });
  }

  async checkForUpdate(): Promise<void> {
    const sw = this.swUpdate;
    if (!sw || !sw.isEnabled) return;

    const now = Date.now();
    if (now - this.lastCheckAt < THROTTLE_MS) return;
    this.lastCheckAt = now;

    try {
      await sw.checkForUpdate();
    } catch {
      // offline or failure: ignore
    }
  }

  private startPeriodic(): void {
    const win = this.resolveWindow();
    const setIntervalFn =
      win?.setInterval ?? (typeof setInterval === 'function' ? setInterval : undefined);
    const clearIntervalFn =
      win?.clearInterval ?? (typeof clearInterval === 'function' ? clearInterval : undefined);
    if (!setIntervalFn) return;
    if (this.periodicTimer !== null) return;
    this.periodicTimer = setIntervalFn(() => {
      void this.checkForUpdate();
    }, CHECK_INTERVAL_MS) as ReturnType<typeof setInterval>;
    if (clearIntervalFn) {
      // store clearer via closure? store id only; cleanup uses global clearInterval
    }
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
    if (win && typeof win.location?.reload === 'function') {
      win.location.reload();
    }
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
    this.visibilityHandler = null;
    this.pageshowHandler = null;

    if (this.periodicTimer !== null) {
      const clearIntervalFn =
        win?.clearInterval ?? (typeof clearInterval === 'function' ? clearInterval : undefined);
      if (clearIntervalFn) clearIntervalFn(this.periodicTimer);
      this.periodicTimer = null;
    }
  }
}

export { UpdateService as PwaUpdateService };
export { UpdateService as SwUpdateService };
export { UpdateService as AppUpdateService };
export default UpdateService;
