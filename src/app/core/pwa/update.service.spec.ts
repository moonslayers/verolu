import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import type { VersionEvent, UnrecoverableStateEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { UpdateService } from './update.service';
import { ToastService } from '../../shared/toast/toast.service';
import { WINDOW } from './pwa-window';

class FakeSwUpdate {
  isEnabled = true;
  versionUpdates = new Subject<VersionEvent>();
  unrecoverable = new Subject<UnrecoverableStateEvent>();
  checkForUpdate = vi.fn().mockResolvedValue(true);
  activateUpdate = vi.fn().mockResolvedValue(true);
}

class FakeAppRef {
  isStable = new Subject<boolean>();
}

describe('UpdateService', () => {
  let sw: FakeSwUpdate;
  let appRef: FakeAppRef;
  let fakeWindow: {
    location: { reload: ReturnType<typeof vi.fn> | undefined };
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let service: UpdateService;
  let toast: ToastService;

  beforeEach(async () => {
    vi.useFakeTimers();
    sw = new FakeSwUpdate();
    appRef = new FakeAppRef();
    fakeWindow = {
      location: { reload: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: sw },
        { provide: ApplicationRef, useValue: appRef },
        { provide: WINDOW, useValue: fakeWindow },
      ],
    }).compileComponents();

    toast = TestBed.inject(ToastService);
    service = TestBed.inject(UpdateService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('SwUpdate nulo: init no-op', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({}).compileComponents();
    const s = TestBed.inject(UpdateService);
    const t = TestBed.inject(ToastService);
    const checkSpy = vi.spyOn(s, 'checkForUpdate');
    s.init();
    expect(checkSpy).not.toHaveBeenCalled();
    expect(t.toasts().length).toBe(0);
  });

  it('isEnabled false: init no suscribe ni añade listeners ni llama checkForUpdate', async () => {
    const disabledSw = new FakeSwUpdate();
    disabledSw.isEnabled = false;
    TestBed.resetTestingModule();
    const noReloadWindow = {
      location: { reload: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    await TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: disabledSw },
        { provide: ApplicationRef, useValue: appRef },
        { provide: WINDOW, useValue: noReloadWindow },
      ],
    }).compileComponents();
    const s = TestBed.inject(UpdateService);
    const t = TestBed.inject(ToastService);
    const subscribeSpy = vi.spyOn(disabledSw.versionUpdates, 'subscribe');
    const addSpy = vi.spyOn(noReloadWindow, 'addEventListener');
    const checkSpy = vi.spyOn(s, 'checkForUpdate');
    s.init();
    expect(subscribeSpy).not.toHaveBeenCalled();
    expect(addSpy).not.toHaveBeenCalled();
    expect(checkSpy).not.toHaveBeenCalled();
    expect(t.toasts().length).toBe(0);
  });

  it('VERSION_READY muestra toast persistente con acción Actualizar', () => {
    service.init();
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    expect(toast.toasts().length).toBe(1);
    const t = toast.toasts()[0];
    expect(t.durationMs).toBe(0);
    expect(t.politeness).toBe('polite');
    expect(t.variant).toBe('neutral');
    expect(t.message).toBe('Hay una nueva versión disponible.');
    expect(t.action?.label).toBe('Actualizar');
  });

  it('VERSION_READY mismo hash no duplica', () => {
    service.init();
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    expect(toast.toasts().length).toBe(1);
  });

  it('VERSION_READY mismo hash tras descartar no reaparece', () => {
    service.init();
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    expect(toast.toasts().length).toBe(1);
    toast.dismiss(toast.toasts()[0].id);
    expect(toast.toasts().length).toBe(0);
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    expect(toast.toasts().length).toBe(0);
  });

  it('acción Actualizar llama activateUpdate y reload', async () => {
    service.init();
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    const t = toast.toasts()[0];
    t.action?.callback();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.activateUpdate).toHaveBeenCalled();
    expect(fakeWindow.location.reload).toHaveBeenCalled();
  });

  it('acción Actualizar recarga aunque activateUpdate rechace', async () => {
    sw.activateUpdate.mockRejectedValue(new Error('fail'));
    service.init();
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'c' },
    } as VersionEvent);
    const t = toast.toasts()[0];
    t.action?.callback();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(fakeWindow.location.reload).toHaveBeenCalled();
  });

  it('VERSION_INSTALLATION_FAILED no muestra toast y warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    service.init();
    sw.versionUpdates.next({
      type: 'VERSION_INSTALLATION_FAILED',
      version: { hash: 'x' },
      error: 'err',
    } as VersionEvent);
    expect(toast.toasts().length).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('unrecoverable muestra toast assertive no dismissible con Recargar', () => {
    service.init();
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'r' } as UnrecoverableStateEvent);
    expect(toast.toasts().length).toBe(1);
    const t = toast.toasts()[0];
    expect(t.politeness).toBe('assertive');
    expect(t.dismissible).toBe(false);
    expect(t.variant).toBe('danger');
    expect(t.action?.label).toBe('Recargar');
    t.action?.callback();
    expect(fakeWindow.location.reload).toHaveBeenCalled();
  });

  it('unrecoverable dedupe por sesión', () => {
    service.init();
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'r' } as UnrecoverableStateEvent);
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'r2' } as UnrecoverableStateEvent);
    expect(toast.toasts().length).toBe(1);
  });

  it('visibilitychange visible llama checkForUpdate', async () => {
    service.init();
    const doc = TestBed.inject(DOCUMENT);
    Object.defineProperty(doc, 'visibilityState', { value: 'visible', configurable: true });
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate).toHaveBeenCalled();
  });

  it('visibilitychange hidden no llama checkForUpdate', async () => {
    service.init();
    const doc = TestBed.inject(DOCUMENT);
    Object.defineProperty(doc, 'visibilityState', { value: 'hidden', configurable: true });
    const before = sw.checkForUpdate.mock.calls.length;
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate.mock.calls.length).toBe(before);
  });

  it('dos visibilitychange seguidos respetan throttle', async () => {
    service.init();
    const doc = TestBed.inject(DOCUMENT);
    Object.defineProperty(doc, 'visibilityState', { value: 'visible', configurable: true });
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    const calls = sw.checkForUpdate.mock.calls.length;
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate.mock.calls.length).toBe(calls);
  });

  it('rechazo de checkForUpdate no arma throttle; reintenta dentro de 60s', async () => {
    sw.checkForUpdate.mockRejectedValue(new Error('offline'));
    service.init();
    const doc = TestBed.inject(DOCUMENT);
    Object.defineProperty(doc, 'visibilityState', { value: 'visible', configurable: true });
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const afterFirst = sw.checkForUpdate.mock.calls.length;
    doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate.mock.calls.length).toBe(afterFirst + 1);
  });

  it('pageshow llama checkForUpdate', async () => {
    service.init();
    vi.advanceTimersByTime(61_000);
    const pageshowCall = fakeWindow.addEventListener.mock.calls.find(
      (c: unknown[]) => c[0] === 'pageshow',
    );
    expect(pageshowCall).toBeTruthy();
    const handler = pageshowCall![1] as () => void;
    handler();
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate).toHaveBeenCalled();
  });

  it('online dispara checkForUpdate', async () => {
    service.init();
    const onlineCall = fakeWindow.addEventListener.mock.calls.find(
      (c: unknown[]) => c[0] === 'online',
    );
    expect(onlineCall).toBeTruthy();
    const handler = onlineCall![1] as () => void;
    const before = sw.checkForUpdate.mock.calls.length;
    handler();
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate.mock.calls.length).toBe(before + 1);
  });

  it('tras isStable verdadero y 60 min chequeo periódico', async () => {
    service.init();
    appRef.isStable.next(true);
    vi.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate).toHaveBeenCalled();
  });

  it('isStable que nunca emite arranca periódico a los 30s', async () => {
    service.init();
    vi.advanceTimersByTime(30_000);
    vi.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(sw.checkForUpdate).toHaveBeenCalled();
  });

  it('rechazo de checkForUpdate no lanza', async () => {
    sw.checkForUpdate.mockRejectedValue(new Error('offline'));
    service.init();
    await expect(service.checkForUpdate()).resolves.toBeUndefined();
  });

  it('reload ausente muestra toast fallback sin lanzar', () => {
    fakeWindow.location.reload = undefined;
    service.init();
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'r' } as UnrecoverableStateEvent);
    const t = toast.toasts()[0];
    expect(() => t.action?.callback()).not.toThrow();
    const fallback = toast
      .toasts()
      .find((x) => x.message === 'No se pudo recargar. Cierra y reabre la app.');
    expect(fallback).toBeTruthy();
    expect(fallback?.politeness).toBe('assertive');
    expect(fallback?.variant).toBe('danger');
    expect(fallback?.durationMs).toBe(0);
  });

  it('reload que lanza muestra toast fallback sin lanzar', () => {
    fakeWindow.location.reload = vi.fn(() => {
      throw new Error('boom');
    });
    service.init();
    sw.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'r' } as UnrecoverableStateEvent);
    const t = toast.toasts()[0];
    expect(() => t.action?.callback()).not.toThrow();
    const fallback = toast
      .toasts()
      .find((x) => x.message === 'No se pudo recargar. Cierra y reabre la app.');
    expect(fallback).toBeTruthy();
  });

  it('init dos veces: una sola suscripción y listener por evento', async () => {
    const versionSubscribeSpy = vi.spyOn(sw.versionUpdates, 'subscribe');
    const unrecoverableSubscribeSpy = vi.spyOn(sw.unrecoverable, 'subscribe');
    const doc = TestBed.inject(DOCUMENT);
    const addDocSpy = vi.spyOn(doc, 'addEventListener');
    const addWinSpy = vi.spyOn(fakeWindow, 'addEventListener');

    service.init();
    service.init();

    expect(versionSubscribeSpy).toHaveBeenCalledTimes(1);
    expect(unrecoverableSubscribeSpy).toHaveBeenCalledTimes(1);
    expect(addDocSpy).toHaveBeenCalledTimes(1);
    expect(addWinSpy).toHaveBeenCalledTimes(2);

    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    expect(toast.toasts().length).toBe(1);
  });

  it('destroy limpia listeners, interval y timeout', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const doc = TestBed.inject(DOCUMENT);
    const removeDocSpy = vi.spyOn(doc, 'removeEventListener');
    const removeWinSpy = vi.spyOn(fakeWindow, 'removeEventListener');

    service.init();
    appRef.isStable.next(true);
    TestBed.resetTestingModule();

    expect(removeDocSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWinSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
    expect(removeWinSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
