import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastOutlet } from './toast-outlet';
import { ToastService } from './toast.service';

describe('ToastOutlet', () => {
  let fixture: ComponentFixture<ToastOutlet>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastOutlet],
    }).compileComponents();
    service = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastOutlet);
    fixture.detectChanges();
  });

  afterEach(() => {
    service.clear();
    TestBed.resetTestingModule();
  });

  it('renderiza un toast polite con texto en la región status', () => {
    service.show({ message: 'hola polite', politeness: 'polite', durationMs: 0 });
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.textContent).toContain('hola polite');
    const alertRegion = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alertRegion.textContent).not.toContain('hola polite');
  });

  it('renderiza un toast assertive con role alert y aria-live assertive', () => {
    service.show({ message: 'alerta', politeness: 'assertive', durationMs: 0 });
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(region).not.toBeNull();
    expect(region.getAttribute('aria-live')).toBe('assertive');
    expect(region.getAttribute('aria-atomic')).toBe('false');
    expect(region.textContent).toContain('alerta');
  });

  it('acción: clic ejecuta callback y elimina el toast', () => {
    const cb = vi.fn();
    service.show({
      message: 'm',
      action: { label: 'Deshacer', callback: cb },
      durationMs: 0,
    });
    fixture.detectChanges();
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLElement).textContent?.includes('Deshacer'),
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    fixture.detectChanges();
    expect(cb).toHaveBeenCalled();
    expect(service.toasts().length).toBe(0);
  });

  it('"Más tarde": elimina el toast sin ejecutar la acción', () => {
    const cb = vi.fn();
    service.show({
      message: 'm',
      action: { label: 'Deshacer', callback: cb },
      durationMs: 0,
    });
    fixture.detectChanges();
    const btn = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLElement).textContent?.includes('Más tarde'),
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    fixture.detectChanges();
    expect(cb).not.toHaveBeenCalled();
    expect(service.toasts().length).toBe(0);
  });

  it('sin action: el cierre usa aria-label="Cerrar"', () => {
    service.show({ message: 'm', dismissible: true, durationMs: 0 });
    fixture.detectChanges();
    const close = fixture.nativeElement.querySelector(
      'button[aria-label="Cerrar"]',
    ) as HTMLButtonElement;
    expect(close).not.toBeNull();
    close.click();
    fixture.detectChanges();
    expect(service.toasts().length).toBe(0);
  });

  it('no dismissible: no hay botón de cierre', () => {
    service.show({ message: 'm', dismissible: false, durationMs: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[aria-label="Cerrar"]')).toBeNull();
  });

  it('sin toasts: contenedores vacíos y sin tarjetas', () => {
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(status.querySelectorAll('article').length).toBe(0);
    expect(alert.querySelectorAll('article').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.shadow-card').length).toBe(0);
  });

  it('no roba foco al aparecer', () => {
    const before = document.activeElement;
    service.show({ message: 'm', durationMs: 0 });
    fixture.detectChanges();
    expect(document.activeElement).toBe(before);
  });

  it('regiones vivas siempre montadas desde el primer render', () => {
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('false');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(alert.getAttribute('aria-atomic')).toBe('false');
  });
});
