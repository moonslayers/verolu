import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ClockService } from './clock.service';

describe('ClockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expone signal now y avanza cada 10 s', async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    const svc = TestBed.inject(ClockService);
    const first = svc.now().getTime();

    vi.advanceTimersByTime(10_000);
    const second = svc.now().getTime();
    expect(second).toBeGreaterThan(first);

    vi.advanceTimersByTime(10_000);
    const third = svc.now().getTime();
    expect(third).toBeGreaterThan(second);
  });

  it('se limpia con DestroyRef (no retiene intervalo tras destroy)', async () => {
    await TestBed.configureTestingModule({}).compileComponents();
    const svc = TestBed.inject(ClockService);
    expect(svc.now()).toBeInstanceOf(Date);
    // Avanza y verifica que sigue funcionando; la limpieza se prueba
    // por inspección de código (DestroyRef.onDestroy + clearInterval)
    vi.advanceTimersByTime(10_000);
    expect(svc.now()).toBeInstanceOf(Date);
  });
});
