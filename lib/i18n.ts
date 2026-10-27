// Shared by server and client code. Text is translated inline next to where
// it's used: t('Home', 'หน้าแรก') returns whichever matches the current
// language. Works for strings and JSX alike.

export type Lang = 'en' | 'th';

export const LANG_COOKIE = 'lang';

export function parseLang(value: string | null | undefined): Lang {
  return value === 'th' ? 'th' : 'en';
}

export type Translate = <T>(en: T, th: T) => T;

export function makeT(lang: Lang): Translate {
  return (en, th) => (lang === 'th' ? th : en);
}

// Thai locale formats dates in the Buddhist calendar, which is what Thai
// readers expect.
export function dateLocale(lang: Lang) {
  return lang === 'th' ? 'th-TH' : 'en-US';
}
