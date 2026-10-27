'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dateLocale, LANG_COOKIE, makeT, type Lang, type Translate } from '@/lib/i18n';

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// The language lives in a cookie (not localStorage) so Server Components and
// the first server render use it too, with no flash of the other language.
export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLangState(next);
      // Re-render Server Components in the new language.
      router.refresh();
    },
    [router]
  );

  const value = useMemo(
    () => ({ lang, setLang, t: makeT(lang), locale: dateLocale(lang) }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
