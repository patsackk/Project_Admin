'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

const POLL_INTERVAL_MS = 30_000;

// Fire this after anything that changes the pending count (e.g. sending a
// reply) so the bell updates without waiting for the next poll.
export const NOTIFICATIONS_REFRESH_EVENT = 'notifications:refresh';

type PendingMessage = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
};

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLanguage();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setCount(data.count);
        setMessages(data.messages);
      } catch {
        // Keep showing the last known state on network errors.
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    window.addEventListener('focus', load);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, load);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', load);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, load);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-sky-100 hover:text-sky-700 transition"
        aria-label={
          count > 0
            ? t(`Notifications (${count} pending)`, `การแจ้งเตือน (รอตอบ ${count})`)
            : t('Notifications', 'การแจ้งเตือน')
        }
        aria-expanded={open}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="card absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden z-30">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold text-gray-900">{t('Notifications', 'การแจ้งเตือน')}</span>
            {count > 0 && (
              <span className="badge bg-amber-100 text-amber-700">{t(`${count} pending`, `รอตอบ ${count}`)}</span>
            )}
          </div>

          {messages.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              {t('No messages awaiting a reply.', 'ไม่มีข้อความที่รอการตอบกลับ')}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y">
              {messages.map((m) => (
                <li key={m.id}>
                  <Link
                    href="/messages"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-sky-50 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {t('New message from ', 'ข้อความใหม่จาก ')}{m.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(m.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{m.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/messages"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 border-t text-center text-sm font-medium text-sky-700 hover:bg-sky-50 transition"
          >
            {t('View all messages', 'ดูข้อความทั้งหมด')}
          </Link>
        </div>
      )}
    </div>
  );
}
