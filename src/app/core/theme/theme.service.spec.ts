import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeRepository } from './theme.repository';
import { ThemeService } from './theme.service';
import { veroluDb } from './theme.db';

const LIGHT_COLOR = '#faf7f0';
const DARK_COLOR = '#141210';

function resetDom(): void {
  document.documentElement.classList.remove('dark');
  const html = document.documentElement as HTMLElement;
  html.style.colorScheme = '';
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
  const lightMeta = document.createElement('meta');
  lightMeta.name = 'theme-color';
  lightMeta.content = '#FAF7F0';
  lightMeta.setAttribute('media', '(prefers-color-scheme: light)');
  document.head.appendChild(lightMeta);
  const darkMeta = document.createElement('meta');
  darkMeta.name = 'theme-color';
  darkMeta.content = '#141210';
  darkMeta.setAttribute('media', '(prefers-color-scheme: dark)');
  document.head.appendChild(darkMeta);
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (!colorSchemeMeta) {
    const m = document.createElement('meta');
    m.name = 'color-scheme';
    m.content = 'light dark';
    document.head.appendChild(m);
  }
}

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
    getListenerCount(): number {
      return listeners.length;
    },
  } as unknown as MediaQueryList & { dispatch: (m: boolean) => void; getListenerCount: () => number };
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

describe('ThemeService', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    resetDom();
    await resetDb();
    TestBed.resetTestingModule();
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

  it('inicia en system y aplica tema claro cuando no hay preferencia guardada', async () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    expect(service.preference()).toBe('system');
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('lee preferencia persistida y aplica tema oscuro al iniciar', async () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const first = TestBed.inject(ThemeService);
    await first.init();
    await first.setPreference('dark');
    const repoCheck = TestBed.inject(ThemeRepository);
    const stored = await repoCheck.getPreference();
    expect(stored).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    TestBed.resetTestingModule();
    mockMatchMedia(false);
    resetDom();
    TestBed.configureTestingModule({});
    const second = TestBed.inject(ThemeService);
    await second.init();
    expect(second.preference()).toBe('dark');
    expect(second.resolvedTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const metas = Array.from(document.querySelectorAll('meta[name="theme-color"]')) as HTMLMetaElement[];
    expect(metas).toHaveLength(1);
    expect(metas[0].content.toLowerCase()).toBe(DARK_COLOR);
  });

  it('persiste entre instancias usando repositorio', async () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    await service.setPreference('light');
    const repo = TestBed.inject(ThemeRepository);
    const stored = await repo.getPreference();
    expect(stored).toBe('light');
    TestBed.resetTestingModule();
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const repo2 = TestBed.inject(ThemeRepository);
    const stored2 = await repo2.getPreference();
    expect(stored2).toBe('light');
  });

  it('cambio a dark aplica clase dark, color-scheme y meta consolidada', async () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    await service.setPreference('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    const metas = Array.from(
      document.querySelectorAll('meta[name="theme-color"]'),
    ) as HTMLMetaElement[];
    expect(metas).toHaveLength(1);
    expect(metas[0].hasAttribute('media')).toBe(false);
    expect(metas[0].content.toLowerCase()).toBe(DARK_COLOR);
  });

  it('cambio a light quita clase dark y actualiza meta', async () => {
    mockMatchMedia(true);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    await service.setPreference('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await service.setPreference('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(meta).not.toBeNull();
    expect(meta.hasAttribute('media')).toBe(false);
    expect(meta.content.toLowerCase()).toBe(LIGHT_COLOR);
  });

  it('modo system reacciona al cambio de prefers-color-scheme', async () => {
    const mql = mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    await service.setPreference('system');
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    mql.dispatch(true);
    await Promise.resolve();
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(meta.content.toLowerCase()).toBe(DARK_COLOR);
    mql.dispatch(false);
    await Promise.resolve();
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('modo explícito ignora cambios del media query', async () => {
    const mql = mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    await service.setPreference('dark');
    expect(service.resolvedTheme()).toBe('dark');
    mql.dispatch(false);
    await Promise.resolve();
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    mql.dispatch(true);
    await Promise.resolve();
    expect(service.resolvedTheme()).toBe('dark');
    await service.setPreference('light');
    mql.dispatch(true);
    await Promise.resolve();
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('no deja ninguna meta theme-color con media tras el init', async () => {
    mockMatchMedia(true);
    resetDom();
    expect(document.querySelectorAll('meta[name="theme-color"][media]')).toHaveLength(2);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    const withMedia = document.querySelectorAll('meta[name="theme-color"][media]');
    expect(withMedia).toHaveLength(0);
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
  });

  it('fallback a system sin errores cuando Dexie rechaza en lectura', async () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const repo = TestBed.inject(ThemeRepository);
    const spy = vi.spyOn(repo, 'getPreference').mockRejectedValue(new Error('IDB fail'));
    const service = TestBed.inject(ThemeService);
    await expect(service.init()).resolves.toBeUndefined();
    expect(service.preference()).toBe('system');
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    const metas = document.querySelectorAll('meta[name="theme-color"][media]');
    expect(metas).toHaveLength(0);
    spy.mockRestore();
  });

  it('fallback mantiene funcionamiento cuando setPreference falla en Dexie', async () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    const repo = TestBed.inject(ThemeRepository);
    vi.spyOn(repo, 'setPreference').mockRejectedValue(new Error('write fail'));
    await expect(service.setPreference('dark')).resolves.toBeUndefined();
    expect(service.preference()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('init es idempotente y mantiene un único listener', async () => {
    const mql = mockMatchMedia(false);
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    await service.init();
    await service.setPreference('dark');
    const countBefore = (mql as unknown as { getListenerCount: () => number }).getListenerCount();
    await service.init();
    await service.init();
    const countAfter = (mql as unknown as { getListenerCount: () => number }).getListenerCount();
    expect(countAfter).toBe(countBefore);
    expect(countAfter).toBe(1);
    expect(service.preference()).toBe('dark');
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
  });
});
