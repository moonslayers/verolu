import 'fake-indexeddb/auto';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  LucideCheck,
  LucideInfo,
  LucideMonitor,
  LucideMoon,
  LucideSettings,
  LucideSun,
  provideLucideConfig,
  provideLucideIcons,
} from '@lucide/angular';
import { SettingsPage } from './settings-page';
import { ThemeRepository } from '../../core/theme/theme.repository';
import { ThemeService } from '../../core/theme/theme.service';
import { veroluDb } from '../../core/theme/theme.db';

function mockMatchMedia(initialMatches: boolean): MediaQueryList & { dispatch: (m: boolean) => void } {
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  const mql = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (type: string, cb: EventListener): void => {
      if (type === 'change') listeners.push(cb as unknown as (e: MediaQueryListEvent) => void);
    },
    removeEventListener: (type: string, cb: EventListener): void => {
      if (type !== 'change') return;
      const idx = listeners.indexOf(cb as unknown as (e: MediaQueryListEvent) => void);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    addListener: (cb: (e: MediaQueryListEvent) => void): void => {
      listeners.push(cb);
    },
    removeListener: (cb: (e: MediaQueryListEvent) => void): void => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    dispatch: (newMatches: boolean): void => {
      (mql as unknown as { matches: boolean }).matches = newMatches;
      const event = { matches: newMatches } as MediaQueryListEvent;
      [...listeners].forEach((l) => l(event));
    },
  } as unknown as MediaQueryList & { dispatch: (m: boolean) => void };
  const stub = (query: string): MediaQueryList => {
    void query;
    return mql as unknown as MediaQueryList;
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: stub,
  });
  return mql;
}

async function resetDb(): Promise<void> {
  try {
    if (!veroluDb.isOpen()) await veroluDb.open();
  } catch {
    // ignore
  }
  try {
    await veroluDb.settings.clear();
  } catch {
    // ignore
  }
}

describe('SettingsPage', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let fixture: ComponentFixture<SettingsPage>;
  let service: ThemeService;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    await resetDb();
    TestBed.resetTestingModule();
    mockMatchMedia(false);

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideLucideConfig({ color: 'currentColor', size: 20, strokeWidth: 1.75 }),
        provideLucideIcons(LucideSun, LucideMoon, LucideMonitor, LucideCheck, LucideInfo, LucideSettings),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    service = TestBed.inject(ThemeService);
    await service.init();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
    TestBed.resetTestingModule();
    try {
      await veroluDb.settings.clear();
    } catch {
      // ignore
    }
    try {
      veroluDb.close();
    } catch {
      // ignore
    }
  });

  it('renderiza 3 opciones de tema como radios con nombres accesibles', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"][name="theme"]') as NodeListOf<HTMLInputElement>;
    expect(radios).toHaveLength(3);
    const labels = Array.from(radios).map((r) => r.getAttribute('aria-label'));
    expect(labels).toEqual(expect.arrayContaining(['Claro', 'Oscuro', 'Sistema']));
    const fieldset = fixture.nativeElement.querySelector('fieldset') as HTMLElement;
    expect(fieldset).not.toBeNull();
    const legend = fieldset.querySelector('legend') as HTMLElement;
    expect(legend).not.toBeNull();
    expect(legend.textContent).toContain('Tema');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Claro');
    expect(text).toContain('Oscuro');
    expect(text).toContain('Sistema');
  });

  it('seleccionar Oscuro llama a ThemeService y persiste (fake-indexeddb)', async () => {
    const setSpy = vi.spyOn(service, 'setPreference');
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"][name="theme"]') as NodeListOf<HTMLInputElement>;
    const oscuro = Array.from(radios).find((r) => r.getAttribute('aria-label') === 'Oscuro');
    expect(oscuro).toBeDefined();
    if (!oscuro) return;
    oscuro.checked = true;
    oscuro.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const pending = setSpy.mock.results[0]?.value as Promise<void> | undefined;
    if (pending) await pending;
    await Promise.resolve();
    expect(setSpy).toHaveBeenCalledWith('dark');
    expect(service.preference()).toBe('dark');
    const repo = TestBed.inject(ThemeRepository);
    const stored = await repo.getPreference();
    expect(stored).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('estado actual se describe correctamente para cada preferencia', async () => {
    const estado = (): string => {
      const el = fixture.nativeElement.querySelector('#tema-estado') as HTMLElement;
      return el.textContent?.trim() ?? '';
    };

    await service.setPreference('light');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(estado()).toBe('Ahora: claro');

    await service.setPreference('dark');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(estado()).toBe('Ahora: oscuro');

    await service.setPreference('system');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(estado()).toBe('Ahora: claro, según tu dispositivo');

    TestBed.resetTestingModule();
    await resetDb();
    const mql = mockMatchMedia(true);
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideLucideConfig({ color: 'currentColor', size: 20, strokeWidth: 1.75 }),
        provideLucideIcons(LucideSun, LucideMoon, LucideMonitor, LucideCheck, LucideInfo, LucideSettings),
      ],
    }).compileComponents();
    const fixture2 = TestBed.createComponent(SettingsPage);
    const service2 = TestBed.inject(ThemeService);
    await service2.init();
    mql.dispatch(true);
    await service2.setPreference('system');
    fixture2.detectChanges();
    await fixture2.whenStable();
    await Promise.resolve();
    fixture2.detectChanges();
    const estado2 = (fixture2.nativeElement.querySelector('#tema-estado') as HTMLElement).textContent?.trim() ?? '';
    expect(estado2).toBe('Ahora: oscuro, según tu dispositivo');
    TestBed.resetTestingModule();
    await resetDb();
  });

  it('anuncio role="status" aparece al cambiar de tema', async () => {
    let status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement | null;
    expect(status).toBeNull();

    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"][name="theme"]') as NodeListOf<HTMLInputElement>;
    const oscuro = Array.from(radios).find((r) => r.getAttribute('aria-label') === 'Oscuro');
    expect(oscuro).toBeDefined();
    if (!oscuro) return;
    oscuro.checked = true;
    oscuro.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement | null;
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain('Tema actualizado a Oscuro');
    expect(status?.getAttribute('aria-live')).toBe('polite');
  });

  it('sección Acerca de con datos correctos y versión constante', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Acerca de');
    expect(text).toContain('Verolu');
    expect(text).toContain('Informática · Prof. Verónica Luna Hernández');
    expect(text).toContain('El horario se consulta sin conexión');
    expect(text).toContain('puedes imprimirlo o exportarlo desde Horario');
    expect(text).toContain('Versión 1.0');
    expect(text).not.toMatch(/notificaciones/i);
    expect(text).not.toMatch(/idioma/i);
    expect(text).not.toMatch(/cuenta/i);
  });

  it('solo hay un indicador visual por fila y radios nativos ocultos', () => {
    const labels = fixture.nativeElement.querySelectorAll('label') as NodeListOf<HTMLElement>;
    const themeLabels = Array.from(labels).filter((l) => l.querySelector('input[type="radio"][name="theme"]'));
    expect(themeLabels).toHaveLength(3);
    themeLabels.forEach((label) => {
      const indicators = label.querySelectorAll('[data-testid="theme-indicator"]');
      expect(indicators).toHaveLength(1);
      const radios = label.querySelectorAll('input[type="radio"][name="theme"]');
      expect(radios).toHaveLength(1);
      const radio = radios[0] as HTMLInputElement;
      expect(radio.classList.contains('sr-only')).toBe(true);
      const visibleNativeRadios = label.querySelectorAll('input[type="radio"].h-5');
      expect(visibleNativeRadios).toHaveLength(0);
    });
  });

  it('fila seleccionada tiene tinte surface-raised, filete accent y check; no seleccionadas neutras', async () => {
    await service.setPreference('dark');
    fixture.detectChanges();
    await fixture.whenStable();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLElement[];
    const themeLabels = labels.filter((l) => l.querySelector('input[type="radio"][name="theme"]'));
    expect(themeLabels).toHaveLength(3);
    const selected = themeLabels.find((l) => (l.querySelector('input') as HTMLInputElement)?.checked);
    expect(selected).toBeDefined();
    expect(selected?.classList.contains('bg-surface-raised')).toBe(true);
    expect(selected?.classList.contains('border-l-accent')).toBe(true);
    const indicator = selected?.querySelector('[data-testid="theme-indicator"]') as HTMLElement;
    expect(indicator.classList.contains('bg-accent')).toBe(true);
    expect(indicator.classList.contains('border-accent')).toBe(true);
    expect(indicator.querySelector('svg')).not.toBeNull();
    const unselected = themeLabels.filter((l) => l !== selected);
    expect(unselected.length).toBe(2);
    unselected.forEach((label) => {
      expect(label.classList.contains('bg-surface')).toBe(true);
      expect(label.classList.contains('border-l-transparent')).toBe(true);
      const ind = label.querySelector('[data-testid="theme-indicator"]') as HTMLElement;
      expect(ind.classList.contains('border-divider')).toBe(true);
      expect(ind.classList.contains('bg-surface')).toBe(true);
      expect(ind.querySelector('svg')).toBeNull();
    });
  });

  it('usa el eje del shell sin max-w propio y texto corto cabe en una línea', () => {
    const section = fixture.nativeElement.querySelector('section[aria-labelledby="settings-title"]') as HTMLElement;
    expect(section).not.toBeNull();
    expect(section.className).not.toMatch(/max-w-\[/);
    expect(section.className).not.toMatch(/mx-auto/);
    expect(section.classList.contains('space-y-6')).toBe(true);
    const headerP = section.querySelector('header p') as HTMLElement;
    expect(headerP.textContent?.trim()).toBe('Sigue el tema de tu dispositivo.');
    const desc = fixture.nativeElement.querySelector('#tema-desc') as HTMLElement;
    expect(desc.textContent?.trim()).toBe('Elige cómo se ve la aplicación.');
    const temaSection = fixture.nativeElement.querySelector('section[aria-labelledby="tema-heading"]') as HTMLElement;
    const acercaSection = fixture.nativeElement.querySelector('section[aria-labelledby="acerca-title"]') as HTMLElement;
    expect(temaSection.classList.contains('space-y-3')).toBe(true);
    expect(acercaSection.classList.contains('space-y-3')).toBe(true);
  });
});
