'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut, PanelLeftOpen, Repeat } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/components/LanguageProvider';
import Tooltip from '@/components/Tooltip';
import type { SidebarState } from '@/app/client-layout';

type TopBarProps = {
  sidebarOpen: SidebarState;
  onOpenSidebar: () => void;
};

export default function TopBar({ sidebarOpen, onOpenSidebar }: TopBarProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const syncAuth = () => {
      setUsername(localStorage.getItem('username'));
    };

    const syncLevel = async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' });
        const data = await res.json();
        setLevel(data.session?.level ?? null);
      } catch {
        setLevel(null);
      }
    };

    syncAuth();
    syncLevel();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('storage', syncLevel);
    window.addEventListener('focus', syncAuth);
    window.addEventListener('focus', syncLevel);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('storage', syncLevel);
      window.removeEventListener('focus', syncAuth);
      window.removeEventListener('focus', syncLevel);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });

    localStorage.removeItem('username');
    setLevel(null);

    window.dispatchEvent(new Event('storage'));

    toast.success(t('Logged out successfully!', 'ออกจากระบบเรียบร้อยแล้ว'));

    router.push('/login');
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-white/90 backdrop-blur border-b px-3 py-2.5 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Shown whenever the sidebar is hidden: always on phone/iPad until
            opened, and on PC only after the user collapses it. */}
        {sidebarOpen !== true && (
          <span className={sidebarOpen === null ? 'lg:hidden' : ''}>
          <Tooltip label={t('Show sidebar', 'แสดงแถบด้านข้าง')} side="bottom" align="left">
            <button
              onClick={onOpenSidebar}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-100 transition"
              aria-label={t('Show sidebar', 'แสดงแถบด้านข้าง')}
            >
              <PanelLeftOpen size={18} />
            </button>
          </Tooltip>
          </span>
        )}
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <img src="/images/logo_noname.png" alt="" className="h-7 w-7 shrink-0 object-contain sm:hidden" />
          <span className="hidden truncate font-semibold text-sm text-gray-700 sm:inline">UTO Admin</span>
        </Link>
      </div>

      {!username ? (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageToggle />
          <Link
            href="/login"
            className="btn-secondary whitespace-nowrap px-3 py-1.5 sm:px-4"
          >
            {t('Sign in', 'เข้าสู่ระบบ')}
          </Link>
          <Link
            href="/register"
            className="btn-primary whitespace-nowrap px-3 py-1.5 sm:px-4"
          >
            {t('Register', 'ลงทะเบียน')}
          </Link>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageToggle />
          <NotificationBell />
          {level && (
            <span className="badge hidden sm:inline-flex bg-sky-100 text-sky-700 capitalize">
              {level === 'admin' ? t('Admin', 'ผู้ดูแลระบบ') : level === 'staff' ? t('Staff', 'พนักงาน') : level}
            </span>
          )}
          {/* Icon-only on phones, where the labels don't fit. */}
          <Link
            href="/choose-role"
            aria-label={t('Switch role', 'เปลี่ยนบทบาท')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-700 transition hover:bg-sky-100 hover:text-sky-700 sm:h-auto sm:w-auto sm:rounded-none sm:hover:bg-transparent"
          >
            <Repeat size={16} className="sm:hidden" />
            <span className="hidden whitespace-nowrap text-sm font-medium sm:inline">{t('Switch role', 'เปลี่ยนบทบาท')}</span>
          </Link>
          <button
            onClick={handleLogout}
            aria-label={t('Logout', 'ออกจากระบบ')}
            className="btn-danger h-8 w-8 px-0 py-0 sm:h-auto sm:w-auto sm:px-4 sm:py-1.5"
          >
            <LogOut size={15} className="sm:hidden" />
            <span className="hidden whitespace-nowrap sm:inline">{t('Logout', 'ออกจากระบบ')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
