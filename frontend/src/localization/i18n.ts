import { en } from './locales/en';
import { am } from './locales/am';
import { om } from './locales/om';
import type { Locale } from '../networking/supabase/types';

export type TranslationDictionary = typeof en;

const dictionaries: Record<Locale, any> = {
  en,
  am,
  om
};

export class I18nEngine {
  private static _instance: I18nEngine | null = null;
  private _currentLocale: Locale = 'en';

  private constructor() {
    const saved = localStorage.getItem('ETHIO_FOOTBALL_LOCALE');
    if (saved === 'am' || saved === 'om' || saved === 'en') {
      this._currentLocale = saved;
    }
  }

  public static getInstance(): I18nEngine {
    if (!I18nEngine._instance) {
      I18nEngine._instance = new I18nEngine();
    }
    return I18nEngine._instance;
  }

  public setLocale(locale: Locale): void {
    this._currentLocale = locale;
    localStorage.setItem('ETHIO_FOOTBALL_LOCALE', locale);
    console.log(`[i18n] Switched locale to: ${locale}`);
  }

  public get currentLocale(): Locale {
    return this._currentLocale;
  }

  /**
   * Lookup translation string by path (e.g. 'home.soloMatch') with parameter interpolation ({count}).
   */
  public t(keyPath: string, params?: Record<string, string | number>): string {
    const keys = keyPath.split('.');
    let dict = dictionaries[this._currentLocale] || dictionaries.en;

    for (const key of keys) {
      if (dict && dict[key] !== undefined) {
        dict = dict[key];
      } else {
        // Fallback to English dictionary if key is missing in target locale
        let fallbackDict = dictionaries.en;
        for (const fk of keys) {
          if (fallbackDict && fallbackDict[fk] !== undefined) {
            fallbackDict = fallbackDict[fk];
          } else {
            return keyPath;
          }
        }
        dict = fallbackDict;
        break;
      }
    }

    if (typeof dict !== 'string') {
      return keyPath;
    }

    let result = dict;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }

    return result;
  }
}

export const i18n = I18nEngine.getInstance();
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);
