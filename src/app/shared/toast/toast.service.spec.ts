import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { effect } from '@angular/core';
import { ToastService } from './toast.service';
import type { ShowToastOptions } from './toast.model';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('show agrega y devuelve id único', () => {
    const id1 = service.show({ message: 'a' });
    const id2 = service.show({ message: 'b' });
    expect(typeof id1).toBe('number');
    expect(id2).not.toBe(id1);
    expect(service.toasts().length).toBe(2);
    expect(service.toasts()[0].id).toBe(id1);
  });

  it('dismiss elimina y es idempotente', () => {
    const id = service.show({ message: 'x' });
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('clear vacía y cancela timers', () => {
    vi.useFakeTimers();
    service.show({ message: 'a', durationMs: 1000 });
    service.show({ message: 'b', durationMs: 2000 });
    service.clear();
    expect(service.toasts().length).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(service.toasts().length).toBe(0);
  });

  it('duración: desaparece al avanzar tiempo; persistente no', () => {
    vi.useFakeTimers();
    service.show({ message: 'temp', durationMs: 1000 });
    service.show({ message: 'perm', durationMs: 0 });
    expect(service.toasts().length).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('perm');
    vi.advanceTimersByTime(10000);
    expect(service.toasts().length).toBe(1);
  });

  it('dismiss cancela timer', () => {
    vi.useFakeTimers();
    const id = service.show({ message: 't', durationMs: 1000 });
    service.dismiss(id);
    vi.advanceTimersByTime(2000);
    expect(service.toasts().length).toBe(0);
  });

  it('límite de 3 descarta transitorio más antiguo (protege persistentes)', () => {
    service.show({ message: 't1', durationMs: 5000 });
    service.show({ message: 't2', durationMs: 5000 });
    service.show({ message: 'p', durationMs: 0 });
    expect(service.toasts().length).toBe(3);
    service.show({ message: 't4', durationMs: 5000 });
    expect(service.toasts().length).toBe(3);
    const messages = service.toasts().map((t) => t.message);
    expect(messages).not.toContain('t1');
    expect(messages).toContain('t4');
  });

  it('protege persistentes y permite exceder el límite si todos son persistentes', () => {
    service.show({ message: 'p1', durationMs: 0 });
    service.show({ message: 'p2', durationMs: 0 });
    service.show({ message: 'p3', durationMs: 0 });
    service.show({ message: 'p4', durationMs: 0 });
    expect(service.toasts().length).toBe(4);
  });

  it('conserva politeness, variant y action', () => {
    const cb = vi.fn();
    const opts: ShowToastOptions = {
      message: 'm',
      action: { label: 'undo', callback: cb },
      dismissible: false,
      politeness: 'assertive',
      durationMs: 0,
      variant: 'danger',
    };
    service.show(opts);
    const t = service.toasts()[0];
    expect(t.politeness).toBe('assertive');
    expect(t.variant).toBe('danger');
    expect(t.dismissible).toBe(false);
    expect(t.action?.label).toBe('undo');
    expect(t.action?.callback).toBe(cb);
  });

  it('defaults', () => {
    service.show({ message: 'm' });
    const t = service.toasts()[0];
    expect(t.dismissible).toBe(true);
    expect(t.politeness).toBe('polite');
    expect(t.durationMs).toBe(5000);
    expect(t.variant).toBe('neutral');
  });

  it('evicción de transitorio cancela su timer (clearTimeout)', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    service.show({ message: 't1', durationMs: 1000 });
    service.show({ message: 't2', durationMs: 1000 });
    service.show({ message: 'p', durationMs: 0 });
    const callsBefore = clearSpy.mock.calls.length;
    service.show({ message: 't4', durationMs: 1000 });
    expect(service.toasts().map((t) => t.message)).not.toContain('t1');
    expect(clearSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    clearSpy.mockRestore();
  });

  it('IDs únicos y monotónicos tras dismiss y clear', () => {
    const id1 = service.show({ message: 'a' });
    const id2 = service.show({ message: 'b' });
    service.dismiss(id1);
    const id3 = service.show({ message: 'c' });
    expect(id3).toBeGreaterThan(id2);
    service.clear();
    const id4 = service.show({ message: 'd' });
    expect(id4).toBeGreaterThan(id3);
    expect(new Set([id1, id2, id3, id4]).size).toBe(4);
  });

  it('dismiss(id inexistente) no rompe ni emite', () => {
    service.show({ message: 'a' });
    const before = service.toasts();
    expect(() => service.dismiss(9999)).not.toThrow();
    expect(service.toasts()).toBe(before);
    expect(service.toasts().length).toBe(1);
  });

  it('show emite una sola vez incluso con evicción', () => {
    service.show({ message: 't1', durationMs: 5000 });
    service.show({ message: 't2', durationMs: 5000 });
    service.show({ message: 'p', durationMs: 0 });
    let count = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        service.toasts();
        count++;
      });
    });
    TestBed.flushEffects();
    const before = count;
    service.show({ message: 't4', durationMs: 5000 });
    TestBed.flushEffects();
    expect(count - before).toBe(1);
  });
});
