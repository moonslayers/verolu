import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeRepository } from './theme.repository';
import type { ResolvedTheme, ThemePreference } from './theme.model';

const LIGHT_THEME_COLOR = '#faf7f0';
const DARK_THEME_COLOR = '#141210';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly repository = inject(ThemeRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentRef = inject(DOCUMENT, { optional: true });

  private readonly _preference = signal<ThemePreference>('system');
  readonly preference = this._preference.asReadonly();

  private readonly systemDark = signal<boolean>(false);

  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const pref = this._preference();
    if (pref === 'system') return this.systemDark() ? 'dark' : 'light';
    return pref;
  });

  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private mql: MediaQueryList | null = null;

  constructor() {
    effect(() => {
      if (!this.initialized) return;
      const resolved = this.resolvedTheme();
      this.applyTheme(resolved);
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit()
      .catch(() => {
        // swallow: fallback to system without unhandled rejection
      })
      .finally(() => {
        this.initialized = true;
        // ensure final reconciliation after flag set (effect would also run)
        try {
          this.applyTheme(this.resolvedTheme());
        } catch {
          // ignore
        }
      });
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    this.initSystemListener();
    let stored: ThemePreference | undefined;
    try {
      stored = await this.repository.getPreference();
    } catch {
      stored = undefined;
    }
    if (stored) {
      this._preference.set(stored);
    }
    // apply immediately even before effect (effect guarded by initialized)
    // but we apply in finally; do early apply to keep pre-paint reconciliation tight
    try {
      this.applyTheme(this.resolvedTheme());
    } catch {
      // ignore
    }
  }

  async setPreference(pref: ThemePreference): Promise<void> {
    this._preference.set(pref);
    // immediate apply; effect will also run when initialized
    try {
      this.applyTheme(this.resolvedTheme());
    } catch {
      // ignore
    }
    try {
      await this.repository.setPreference(pref);
    } catch {
      // swallow
    }
  }

  private initSystemListener(): void {
    if (this.mql) return;
    const win = typeof window !== 'undefined' ? window : undefined;
    if (!win || typeof win.matchMedia !== 'function') return;
    try {
      const mql = win.matchMedia('(prefers-color-scheme: dark)');
      this.mql = mql;
      this.systemDark.set(mql.matches);
      const handler = (event: MediaQueryListEvent): void => {
        if (this._preference() !== 'system') return;
        this.systemDark.set(event.matches);
        try {
          this.applyTheme(this.resolvedTheme());
        } catch {
          // ignore
        }
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
        this.destroyRef.onDestroy(() => {
          try {
            mql.removeEventListener('change', handler);
          } catch {
            // ignore
          }
        });
      } else {
        const legacy = mql as unknown as {
          addListener: (cb: (e: MediaQueryListEvent) => void) => void;
          removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
        };
        if (typeof legacy.addListener === 'function') {
          legacy.addListener(handler);
          this.destroyRef.onDestroy(() => {
            try {
              legacy.removeListener(handler);
            } catch {
              // ignore
            }
          });
        }
      }
    } catch {
      // ignore: system preference stays light
    }
  }

  private applyTheme(resolved: ResolvedTheme): void {
    const doc = this.resolveDocument();
    if (!doc) return;
    const html = doc.documentElement;
    if (!html) return;
    html.classList.toggle('dark', resolved === 'dark');
    try {
      html.style.colorScheme = resolved;
    } catch {
      // ignore
    }
    this.consolidateThemeColor(doc, resolved);
  }

  private resolveDocument(): Document | null {
    if (this.documentRef) return this.documentRef as Document;
    if (typeof document !== 'undefined') return document;
    return null;
  }

  private consolidateThemeColor(doc: Document, resolved: ResolvedTheme): void {
    const color = resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    const metas = Array.from(
      doc.querySelectorAll('meta[name="theme-color"]'),
    ) as HTMLMetaElement[];
    if (metas.length === 0) {
      const meta = doc.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      doc.head.appendChild(meta);
      return;
    }
    metas.forEach((meta, index) => {
      if (index === 0) {
        meta.removeAttribute('media');
        meta.content = color;
      } else {
        meta.remove();
      }
    });
  }
}
