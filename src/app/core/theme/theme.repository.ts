import { Injectable } from '@angular/core';
import { veroluDb } from './theme.db';
import type { ThemePreference } from './theme.model';
import type { Setting } from './theme.db';

const THEME_KEY = 'themePreference';

const VALID_PREFERENCES: ReadonlySet<ThemePreference> = new Set([
  'light',
  'dark',
  'system',
]);

function isValidPreference(value: string): value is ThemePreference {
  return VALID_PREFERENCES.has(value as ThemePreference);
}

@Injectable({ providedIn: 'root' })
export class ThemeRepository {
  private readonly db = veroluDb;

  async getPreference(): Promise<ThemePreference | undefined> {
    try {
      const entry = await this.db.settings.get(THEME_KEY);
      if (!entry) return undefined;
      if (isValidPreference(entry.value)) return entry.value;
      return undefined;
    } catch {
      return undefined;
    }
  }

  async setPreference(pref: ThemePreference): Promise<void> {
    try {
      const setting: Setting = { key: THEME_KEY, value: pref };
      await this.db.settings.put(setting);
    } catch {
      // swallow: fallback to system without unhandled rejection
    }
  }
}
