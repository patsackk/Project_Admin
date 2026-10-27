'use client';

import { useLanguage } from '@/components/LanguageProvider';
import type { Lang } from '@/lib/i18n';

const options: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'th', label: 'TH' },
];

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('Language', 'ภาษา')}
      className="flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold"
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={`rounded-full px-2.5 py-1 transition ${
            lang === o.value ? 'bg-sky-600 text-white' : 'text-gray-500 hover:text-sky-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
